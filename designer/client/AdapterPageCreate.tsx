import {i18n, withI18n} from "../../digital-form-builder/designer/client/i18n";
import {hasValidationErrors, validateTitle} from "../../digital-form-builder/designer/client/validations";
import {addPage} from "../../digital-form-builder/designer/client/data/page/addPage";
import {addLink} from "../../digital-form-builder/designer/client/data";
import logger from "../../digital-form-builder/designer/client/plugins/logger";
import {toUrl} from "../../digital-form-builder/designer/client/helpers";
import randomId from "../../digital-form-builder/designer/client/randomId";
import ErrorSummary from "../../digital-form-builder/designer/client/error-summary";
import SelectConditions from "../../digital-form-builder/designer/client/conditions/SelectConditions";
import {RenderInPortal} from "../../digital-form-builder/designer/client/components/RenderInPortal";
import {Flyout} from "../../digital-form-builder/designer/client/components/Flyout";
import SectionEdit from "../../digital-form-builder/designer/client/section/section-edit";
import React from "react";
import {AdapterDataContext} from "./context/AdapterDataContext";
//@ts-ignore
import {Input} from "@govuk-jsx/input";


// @ts-ignore
export class AdapterPageCreate extends React.Component {
    static contextType = AdapterDataContext;

    constructor(props, context) {
        super(props, context);
        //@ts-ignore
        const {page} = this.props;
        this.state = {
            path: "/",
            controller: page?.controller ?? "",
            title: page?.title,
            section: page?.section ?? {},
            isEditingSection: false,
            errors: {},
        };
    }

    onSubmit = async (e) => {
        e.preventDefault();

        const {data, save} = this.context;
        //@ts-ignore
        const title = this.state.title?.trim();
        //@ts-ignore
        const linkFrom = this.state.linkFrom?.trim();
        //@ts-ignore
        const section = this.state.section?.name?.trim();
        //@ts-ignore
        const pageType = this.state.pageType?.trim();
        //@ts-ignore
        const selectedCondition = this.state.selectedCondition?.trim();
        //@ts-ignore
        const path = this.state.path;

        let validationErrors = this.validate(title, path);
        if (hasValidationErrors(validationErrors)) return;

        const value = {
            path,
            title,
            components: [],
            next: [],
        };
        if (section) {
            //@ts-ignore
            value.section = section;
        }
        if (pageType) {
            //@ts-ignore
            value.controller = pageType;
        }
        //@ts-ignore
        let copy = addPage({...data}, value);

        if (linkFrom) {
            copy = addLink(copy, linkFrom, path, selectedCondition);
        }
        try {
            await save(copy);
            //@ts-ignore
            this.props.onCreate({value});
        } catch (err) {
            logger.error("PageCreate", err);
        }
    };

    validate = (title, path) => {
        const {data} = this.context;
        const titleErrors = validateTitle("page-title", title, i18n);
        const errors = {...titleErrors};
        const alreadyExists = data.pages.find((page) => page.path === path);
        if (alreadyExists) {
            errors.path = {
                href: "#page-path",
                children: `Path '${path}' already exists`,
            };
        }

        this.setState({errors});

        return errors;
    };

    generatePath(title, data) {
        let path = toUrl(title);
        if (
            title.length > 0 &&
            data.pages.find((page) => page.path.startsWith(path))
        ) {
            path = `${path}-${randomId()}`;
        }

        return path;
    }

    findSectionWithName(name) {
        const {data} = this.context;
        const {sections} = data;
        return sections.find((section) => section.name === name);
    }

    onChangeSection = (e) => {
        this.setState({
            section: this.findSectionWithName(e.target.value),
        });
    };

    onChangeLinkFrom = (e) => {
        const input = e.target;
        this.setState({
            linkFrom: input.value,
        });
    };

    onChangePageType = (e) => {
        const input = e.target;
        this.setState({
            pageType: input.value,
        });
    };

    onChangeTitle = (e) => {
        const {data} = this.context;
        const input = e.target;
        const title = input.value;
        this.setState({
            title: title,
            path: this.generatePath(title, data),
        });
    };

    onChangePath = (e) => {
        const input = e.target;
        const path = input.value.startsWith("/") ? input.value : `/${input.value}`;
        const sanitisedPath = path.replace(/\s/g, "-");
        this.setState({
            path: sanitisedPath,
        });
    };

    conditionSelected = (selectedCondition) => {
        this.setState({
            selectedCondition: selectedCondition,
        });
    };

    editSection = (e, section) => {
        e.preventDefault();
        this.setState({
            section,
            isEditingSection: true,
        });
    };

    closeFlyout = (sectionName) => {
        //@ts-ignore
        const propSection = this.state.section ?? {};
        this.setState({
            isEditingSection: false,
            section: sectionName
                ? this.findSectionWithName(sectionName)
                : propSection,
        });
    };

    render() {
        const {data} = this.context;
        const {sections, pages} = data;
        //@ts-ignore
        const {pageType, linkFrom, title, section, path, isEditingSection, errors,} = this.state;

        return (
            <div>
                {
                    //@ts-ignore
                    hasValidationErrors(errors) > 0 && (
                        <ErrorSummary errorList={Object.values(errors)}/>
                    )}
                <form onSubmit={(e) => this.onSubmit(e)} autoComplete="off">
                    <div className="govuk-form-group">
                        <label className="govuk-label govuk-label--s" htmlFor="page-type">
                            {i18n("addPage.pageTypeOption.title")}
                        </label>
                        <span className="govuk-hint">
              {i18n("addPage.pageTypeOption.helpText")}
            </span>
                        <select
                            className="govuk-select"
                            id="page-type"
                            name="page-type"
                            value={pageType}
                            onChange={this.onChangePageType}
                        >
                            <option value="">Question Page</option>
                            <option value="./pages/start.js">Start Page</option>
                            <option value="./pages/summary.js">Summary Page</option>
                        </select>
                    </div>

                    <div className="govuk-form-group">
                        <label className="govuk-label govuk-label--s" htmlFor="link-from">
                            {i18n("addPage.linkFromOption.title")}
                        </label>
                        <span className="govuk-hint">
              {i18n("addPage.linkFromOption.helpText")}
            </span>
                        <select
                            className="govuk-select"
                            id="link-from"
                            name="from"
                            value={linkFrom}
                            onChange={this.onChangeLinkFrom}
                        >
                            <option/>
                            {pages?.map((page) => (
                                <option key={page.path} value={page.path}>
                                    {page.path}
                                </option>
                            ))}
                        </select>
                    </div>

                    {linkFrom && linkFrom.trim() !== "" && (
                        //@ts-ignore
                        <SelectConditions
                            data={data}
                            path={linkFrom}
                            conditionsChange={this.conditionSelected}
                            noFieldsHintText={i18n("conditions.noFieldsAvailable")}
                        />
                    )}

                    <Input
                        id="page-title"
                        name="title"
                        label={{
                            className: "govuk-label--s",
                            children: [i18n("addPage.pageTitleField.title")],
                        }}
                        value={title || ""}
                        onChange={this.onChangeTitle}
                        errorMessage={
                            errors?.title ? {children: errors?.title.children} : undefined
                        }
                    />

                    <Input
                        id="page-path"
                        name="path"
                        label={{
                            className: "govuk-label--s",
                            children: [i18n("addPage.pathField.title")],
                        }}
                        hint={{
                            children: [i18n("addPage.pathField.helpText")],
                        }}
                        value={path}
                        onChange={this.onChangePath}
                        errorMessage={
                            errors?.path ? {children: errors?.path?.children} : undefined
                        }
                    />

                    <div className="govuk-form-group">
                        <label
                            className="govuk-label govuk-label--s"
                            htmlFor="page-section"
                        >
                            {i18n("addPage.sectionOption.title")}
                        </label>
                        <span className="govuk-hint">
              {i18n("addPage.sectionOption.helpText")}
            </span>
                        {sections?.length > 0 && (
                            <select
                                className="govuk-select"
                                id="page-section"
                                name="section"
                                value={section?.name}
                                onChange={this.onChangeSection}
                            >
                                <option/>
                                {sections.map((section) => (
                                    <option key={section.name} value={section.name}>
                                        {section.title}
                                    </option>
                                ))}
                            </select>
                        )}
                        {section?.name && (
                            //@ts-ignore
                            <a href="#" className="govuk-link govuk-!-display-block" onClick={this.editSection}>
                                Edit section
                            </a>
                        )//@ts-ignore
                        }<a href="#" className="govuk-link govuk-!-display-block" onClick={this.editSection}>
                        Create section
                    </a>
                    </div>

                    <button type="submit" className="govuk-button">
                        Save
                    </button>
                </form>
                {isEditingSection && (
                    <RenderInPortal>
                        <Flyout
                            title={`${
                                section?.name ? `Editing ${section.name}` : "Add a new section"
                            }`} //@ts-ignore
                            onHide={this.closeFlyout}
                            show={true}
                            //@ts-ignore
                        ><SectionEdit section={section} data={data} closeFlyout={this.closeFlyout}/>
                        </Flyout>
                    </RenderInPortal>
                )}
            </div>
        );
    }
}

// @ts-ignore
export default withI18n(AdapterPageCreate);
