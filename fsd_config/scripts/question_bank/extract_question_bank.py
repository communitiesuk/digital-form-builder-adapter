#!/usr/bin/env python3
"""
Extract every question asked across all historical grant forms into a clean,
structured corpus suitable for downstream analysis (e.g. theme clustering,
duplicate detection, unified-template design).

Reads the form definition JSON files under ``fsd_config/form_jsons`` and emits
three artefacts into ``fsd_config/scripts/question_bank/output``:

  * question_bank.md     - human + LLM readable, grouped Grant > Section > Page
  * question_bank.jsonl  - one normalised question per line (for clustering)
  * HANDOFF.md           - brief for the downstream Claude task + corpus stats

Design notes
------------
* English only: ``/cy/`` (Welsh) duplicate forms are skipped.
* Presentational components (Para, Html, Details, InsetText, List) are not
  questions and are dropped.
* "Check your answers" / summary pages carry no questions and are dropped.
* MultiInputField is a repeating table; its child components are expanded into
  individual sub-questions, tagged with the table they belong to.
* Components that reference a ``list`` have their answer options resolved.
"""

import json
import glob
import os
import re
import collections
import html

HERE = os.path.dirname(os.path.abspath(__file__))
FORMS_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "form_jsons"))
OUT_DIR = os.path.join(HERE, "output")

# Components that render content rather than ask a question.
PRESENTATIONAL = {"Para", "Html", "Details", "InsetText", "List"}

# Raw builder component type -> plain-English answer format.
TYPE_LABELS = {
    "TextField": "Short text",
    "FreeTextField": "Long free text",
    "MultilineTextField": "Long free text",
    "YesNoField": "Yes / No",
    "RadiosField": "Single choice",
    "SelectField": "Single choice (dropdown)",
    "AutocompleteField": "Single choice (dropdown)",
    "CheckboxesField": "Multiple choice (select all that apply)",
    "NumberField": "Number",
    "DatePartsField": "Date",
    "MonthYearField": "Month / year",
    "EmailAddressField": "Email address",
    "WebsiteField": "Website / URL",
    "TelephoneNumberField": "Phone number",
    "UkAddressField": "UK address",
    "ClientSideFileUploadField": "File upload",
    "MultiInputField": "Repeating table",
}

# Human-readable name for each grant family folder. Pulled from the form
# "name" field where present; these are manual fallbacks for forms whose
# "name" is blank or unhelpful.
FAMILY_LABEL_FALLBACK = {
    "ctdf_r2": "Crash Test Dummy Fund (test data)",
    "ehcf_r1": "Energy & Hardship Community Fund",
    "lahf_lahftu": "Local Authority Housing Fund",
    "nwp_r1": "National Wraparound Programme",
    "shif_apply": "Supported Housing Improvement Fund",
    "pfn_rp": "Plan for Neighbourhoods (10 Year Vision)",
    "generic": "Generic / sample form",
    "sf_r1": "Sample Fund",
    "uf1_r1": "Sample Fund (uf1)",
}


_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def clean_text(value):
    """Strip HTML tags/entities and collapse whitespace to plain text."""
    if not value:
        return ""
    text = _TAG_RE.sub(" ", value)
    text = html.unescape(text)
    return _WS_RE.sub(" ", text).strip()


def resolve_options(component, lists_by_name):
    """Return the list of human-readable answer options for a component."""
    items = []
    if component.get("list"):
        lst = lists_by_name.get(component["list"])
        if lst:
            items = lst.get("items", [])
    elif component.get("values", {}).get("items"):
        items = component["values"]["items"]
    elif component.get("items"):
        items = component["items"]
    return [clean_text(it.get("text")) for it in items if clean_text(it.get("text"))]


def component_required(component):
    """True/False if explicitly set, else None (unspecified)."""
    return component.get("options", {}).get("required")


def emit_question(component, lists_by_name, table=None):
    """Turn a question component into a normalised dict (or None to skip)."""
    ctype = component.get("type")
    if ctype in PRESENTATIONAL:
        return None
    title = clean_text(component.get("title"))
    if not title:
        return None
    return {
        "question": title,
        "hint": clean_text(component.get("hint")),
        "answer_format": TYPE_LABELS.get(ctype, ctype),
        "raw_type": ctype,
        "options": resolve_options(component, lists_by_name),
        "required": component_required(component),
        "within_table": table,
    }


def walk_form(path):
    """Yield normalised question dicts for one form file, in page order."""
    with open(path, encoding="utf-8") as fh:
        form = json.load(fh)

    lists_by_name = {l["name"]: l for l in form.get("lists", []) if l.get("name")}
    sections_by_id = {s["name"]: s.get("title", "") for s in form.get("sections", [])}

    rel = os.path.relpath(path, FORMS_ROOT)
    family = rel.split(os.sep)[0]
    grant_name = (form.get("name") or "").strip()

    for page in form.get("pages", []):
        page_title = (page.get("title") or "").strip()
        if page_title.lower() in {"check your answers", "summary"}:
            continue
        section = sections_by_id.get(page.get("section"), "")
        for comp in page.get("components", []):
            if comp.get("type") == "MultiInputField":
                table_title = (comp.get("title") or "").strip()
                parent = emit_question(comp, lists_by_name)
                if parent:
                    parent["within_table"] = None
                    yield _meta(parent, family, grant_name, section, page_title, rel)
                for child in comp.get("children", []):
                    q = emit_question(child, lists_by_name, table=table_title)
                    if q:
                        yield _meta(q, family, grant_name, section, page_title, rel)
            else:
                q = emit_question(comp, lists_by_name)
                if q:
                    yield _meta(q, family, grant_name, section, page_title, rel)


def _meta(q, family, grant_name, section, page, source):
    q.update({
        "grant_family": family,
        "grant_name": grant_name,
        "section": section,
        "page": page,
        "source_file": source,
    })
    return q


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    files = sorted(
        f for f in glob.glob(os.path.join(FORMS_ROOT, "**", "*.json"), recursive=True)
        if os.sep + "cy" + os.sep not in f  # English only
    )

    questions = []
    skipped = 0
    for f in files:
        try:
            questions.extend(walk_form(f))
        except (json.JSONDecodeError, KeyError):
            skipped += 1

    # Derive a display label per family (prefer the real form name).
    family_names = collections.defaultdict(collections.Counter)
    for q in questions:
        if q["grant_name"]:
            family_names[q["grant_family"]][q["grant_name"]] += 1
    family_label = {}
    for fam in sorted({q["grant_family"] for q in questions}):
        if family_names[fam]:
            family_label[fam] = family_names[fam].most_common(1)[0][0]
        else:
            family_label[fam] = FAMILY_LABEL_FALLBACK.get(fam, fam)

    write_jsonl(questions)
    write_markdown(questions, family_label)
    write_handoff(questions, family_label, len(files), skipped)

    print(f"Forms read: {len(files)} (English)   parse-skipped: {skipped}")
    print(f"Questions extracted: {len(questions)}")
    print(f"Grant families: {len(family_label)}")
    print(f"Output written to: {OUT_DIR}")


def write_jsonl(questions):
    with open(os.path.join(OUT_DIR, "question_bank.jsonl"), "w", encoding="utf-8") as fh:
        for q in questions:
            fh.write(json.dumps(q, ensure_ascii=False) + "\n")


def write_markdown(questions, family_label):
    # Group: family -> section -> page -> [questions], preserving order.
    tree = collections.OrderedDict()
    for q in questions:
        tree.setdefault(q["grant_family"], collections.OrderedDict()) \
            .setdefault(q["section"] or "(no section)", collections.OrderedDict()) \
            .setdefault(q["page"] or "(no page)", []).append(q)

    lines = ["# Grant form question bank", "",
             "Every question asked across all historical grant application forms, "
             "grouped by grant > section > page. Generated from `fsd_config/form_jsons` "
             "(English forms only). See `HANDOFF.md` for context and suggested analysis.",
             ""]
    for fam, sections in tree.items():
        lines.append(f"## {family_label[fam]}  \n`{fam}`\n")
        for section, pages in sections.items():
            lines.append(f"### {section}\n")
            for page, qs in pages.items():
                lines.append(f"**{page}**\n")
                for q in qs:
                    bits = [f"_{q['answer_format']}_"]
                    if q["required"] is False:
                        bits.append("optional")
                    prefix = f"  ↳ (in table: {q['within_table']}) " if q["within_table"] else ""
                    lines.append(f"- {prefix}{q['question']}  ({', '.join(bits)})")
                    if q["hint"]:
                        lines.append(f"  - hint: {q['hint']}")
                    if q["options"]:
                        opts = "; ".join(q["options"][:12])
                        more = "" if len(q["options"]) <= 12 else f" …(+{len(q['options'])-12} more)"
                        lines.append(f"  - options: {opts}{more}")
                lines.append("")
    with open(os.path.join(OUT_DIR, "question_bank.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def write_handoff(questions, family_label, n_forms, skipped):
    by_family = collections.Counter(q["grant_family"] for q in questions)
    by_format = collections.Counter(q["answer_format"] for q in questions)
    approx_tokens = sum(len(q["question"]) + len(q["hint"]) for q in questions) // 4

    lines = [
        "# Handoff brief: grant form question bank", "",
        "## What this is",
        f"A normalised corpus of **{len(questions)} questions** drawn from "
        f"**{len(family_label)} grant funds** ({n_forms} English form files). "
        "Each question carries its grant, section, page, answer format, answer "
        "options, and whether it is optional. Presentational text and "
        "\"check your answers\" pages have been stripped.", "",
        "## Files",
        "- `question_bank.md` — readable, grouped by grant > section > page.",
        "- `question_bank.jsonl` — one question per line; best for programmatic "
        "clustering. Fields: `question`, `hint`, `answer_format`, `raw_type`, "
        "`options`, `required`, `within_table`, `grant_family`, `grant_name`, "
        "`section`, `page`, `source_file`.", "",
        f"## Size / cost",
        f"The question + hint text is roughly **{approx_tokens:,} tokens** — small "
        "enough to fit the whole corpus in a single context window.", "",
        "## Suggested analysis for the downstream task",
        "1. **Cluster** the questions into recurring themes (e.g. organisation "
        "details, eligibility, finances, project plan, outcomes, risk, declarations).",
        "2. **Find duplicates / near-duplicates** asked across different funds — "
        "candidates for a single shared question.",
        "3. **Note phrasing drift**: same intent, different wording — propose one "
        "canonical phrasing.",
        "4. **Map answer formats**: where the same question uses different formats "
        "(e.g. free text vs multiple choice) across funds, flag the inconsistency.",
        "5. Output a **de-duplicated, themed question bank** as the starting point "
        "for unified templates.", "",
        "## Questions per grant fund",
    ]
    for fam, n in sorted(by_family.items(), key=lambda kv: -kv[1]):
        lines.append(f"- {family_label[fam]} (`{fam}`): {n}")
    lines += ["", "## Questions by answer format"]
    for fmt, n in by_format.most_common():
        lines.append(f"- {fmt}: {n}")
    if skipped:
        lines += ["", f"_Note: {skipped} JSON file(s) could not be parsed and were skipped._"]

    with open(os.path.join(OUT_DIR, "HANDOFF.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


if __name__ == "__main__":
    main()
