import config from "../config";
import wreck from "@hapi/wreck";

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

export class PreAwardApiClient {
    private readonly baseUrl: string;
    private readonly wreck: any;

    constructor() {
        this.baseUrl = config.preAwardApiUrl;
        this.wreck = wreck.defaults({
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }

    async createOrUpdateForm(formData: FormData): Promise<FormDraftResponse>{
        const payload = formData;
        const { payload: responseData  } = await this.wreck.post(
            `${this.baseUrl}`,
            {
                payload: JSON.stringify(payload)
            }
        );
        const parsedData = JSON.parse((responseData as Buffer).toString());
        return parsedData as FormDraftResponse;
    }

    async getAllForms(): Promise<FormResponse[]> {
        const { payload: responseData } = await this.wreck.get(
            `${this.baseUrl}`
        );
        const parsedData = JSON.parse((responseData as Buffer).toString());
        return parsedData as FormResponse[];
    }

    async getFormDraft(name: string): Promise<FormDraftResponse>{
        const { payload: responseData } = await this.wreck.get(
            `${this.baseUrl}/${name}/draft`
        );
        const parsedData = JSON.parse((responseData as Buffer).toString());
        return parsedData as FormDraftResponse;
    }
}

export const preAwardApiClient = new PreAwardApiClient();
