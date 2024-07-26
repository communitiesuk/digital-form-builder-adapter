import {FormDefinition} from "@xgovformbuilder/model";
import {RepeatingFieldPage} from "@xgovformbuilder/model";
import {AdapterComponentDef} from "../components";


/**
 * `FormDefinition` is a typescript representation of `Schema`
 */
export type AdapterFormDefinition = FormDefinition & {
    pages: Array<AdapterPage | RepeatingFieldPage>;
    markAsComplete?: boolean | undefined;
}


export interface AdapterPage {
    title: string;
    path: string;
    controller: string;
    components?: AdapterComponentDef[];
    section?: string; // the section ID
    next?: { path: string; condition?: string }[];
}
