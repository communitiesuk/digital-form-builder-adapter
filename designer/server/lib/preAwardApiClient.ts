import config from "../config";
import Wreck from "@hapi/wreck";

interface FormJson {
    startPage: string;
    pages: any[];
    sections: any[];
    name: string;
    version?: number;
    conditions?: any[];
    lists?: any[];
    metadata?: any;
    fees?: any[];
    outputs?: any[];
    skipSummary?: boolean;
    [key: string]: any;
}

export interface FormData {
    name: string;
    form_json: FormJson;
}

export interface FormResponse {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    draft_json: FormJson;
    published_json: FormJson;
    is_published: boolean;
}

export class PreAwardApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.preAwardApiUrl;
    }

    async createOrUpdateForm(name: string, form_json: FormJson): Promise<FormResponse>{
        const payload = {
            name: name,
            form_json: form_json,
        };

        try{
            const { payload: responseData  } = await Wreck.post(
                `${this.baseUrl}/forms`,
                {
                    payload: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const parsedData = JSON.parse((responseData as Buffer).toString());

            return parsedData as FormResponse;
        }
        catch (error) {

            throw error;
        }
    }

    async getAllForms(): Promise<FormResponse[]> {
        try {

            const { payload: responseData } = await Wreck.get(
                `${this.baseUrl}/forms`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );



            
            const parsedData = JSON.parse((responseData as Buffer).toString());


            
            return parsedData as FormResponse[];
        } catch (error) {

            throw error;
        }
    }

    async getFormDraft(name: string): Promise<FormJson>{
        try{
            const { payload: responseData } = await Wreck.get(
                `${this.baseUrl}/forms/${name}/draft`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            const parsedData = JSON.parse((responseData as Buffer).toString());

            return parsedData as FormJson;
        }
        catch (error) {

            throw error;
        }
    }
}

export const preAwardApiClient = new PreAwardApiClient();
