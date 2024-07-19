import {FormDefinition} from "@xgovformbuilder/model";


/**
 * `FormDefinition` is a typescript representation of `Schema`
 */
export type AdapterFormDefinition = FormDefinition & {
    markAsComplete?: boolean | undefined;
}
