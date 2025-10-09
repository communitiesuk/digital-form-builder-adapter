export interface FormData {
  url_path: string;
  display_name: string;
  form_json: Record<string, any>;
}

export interface FormResponse {
  id: string;
  url_path: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  is_published: boolean;
}

export interface FormDraftResponse extends FormResponse {
  draft_json: Record<string, any>;
}

interface StoredForm extends FormData {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  is_published: boolean;
}

export class InMemoryStore {
  private readonly forms: Map<string, StoredForm> = new Map();

  createOrUpdateForm(formData: FormData): FormDraftResponse {
    const now = new Date().toISOString();
    const existing = this.forms.get(formData.url_path);

    const storedForm: StoredForm = {
      ...formData,
      id: formData.url_path,
      created_at: existing?.created_at || now,
      updated_at: now,
      published_at: existing?.published_at || null,
      is_published: existing?.is_published || false,
    };

    this.forms.set(formData.url_path, storedForm);

    return {
      id: storedForm.id,
      url_path: storedForm.url_path,
      display_name: storedForm.display_name,
      created_at: storedForm.created_at,
      updated_at: storedForm.updated_at,
      published_at: storedForm.published_at,
      is_published: storedForm.is_published,
      draft_json: storedForm.form_json,
    };
  }

  getAllForms(): FormResponse[] {
    return Array.from(this.forms.values()).map(form => ({
      id: form.id,
      url_path: form.url_path,
      display_name: form.display_name,
      created_at: form.created_at,
      updated_at: form.updated_at,
      published_at: form.published_at,
      is_published: form.is_published,
    }));
  }

  getFormDraft(urlPath: string): FormDraftResponse | null {
    const form = this.forms.get(urlPath);
    if (!form) return null;

    return {
      id: form.id,
      url_path: form.url_path,
      display_name: form.display_name,
      created_at: form.created_at,
      updated_at: form.updated_at,
      published_at: form.published_at,
      is_published: form.is_published,
      draft_json: form.form_json,
    };
  }

  deleteForm(urlPath: string): boolean {
    return this.forms.delete(urlPath);
  }

  clear(): void {
    this.forms.clear();
  }
}