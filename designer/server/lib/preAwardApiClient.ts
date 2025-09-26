import config from "../config";
import wreck from "@hapi/wreck";

export interface FormData {
    url_path: string;
    display_name?: string;
    form_json: Record<string, any>;
}

export interface FormResponse {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    is_published: boolean;
    Key: string;
    DisplayName: string;
    LastModified: string;
}

export class PreAwardApiClient {
    private baseUrl: string;
    private wreck: any;

    constructor() {
        this.baseUrl = config.preAwardApiUrl;
        this.wreck = wreck.defaults({
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }

    async createOrUpdateForm(formData: FormData): Promise<FormResponse>{
        const payload = formData;
        const { payload: responseData  } = await this.wreck.post(
            `${this.baseUrl}`,
            {
                payload: JSON.stringify(payload)
            }
        );
        const parsedData = JSON.parse((responseData as Buffer).toString());
        return parsedData as FormResponse;
    }

    async getAllForms(): Promise<FormResponse[]> {
        const { payload: responseData } = await this.wreck.get(
            `${this.baseUrl}`
        );
        const parsedData = JSON.parse((responseData as Buffer).toString());
        // Transform Pre-Award API response to form-designer expected format
        return parsedData.map(form => ({
            Key: form.url_path,
            DisplayName: form.display_name,
            LastModified: form.updated_at,
            ...form
        }));
    }

    async getFormDraft(name: string): Promise<Record<string, any>>{
        const { payload: responseData } = await this.wreck.get(
            `${this.baseUrl}/${name}/draft`
        );
        const parsedData = JSON.parse((responseData as Buffer).toString());
        return parsedData as Record<string, any>;
    }
}

export const preAwardApiClient = new PreAwardApiClient();
