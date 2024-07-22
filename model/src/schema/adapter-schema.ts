import joi from "joi";
import {Schema} from "@xgovformbuilder/model";

export const ExtendedAdapterSchema: any = joi.object().required().keys({
    markAsComplete: joi.boolean().default(false)
});

export const AdapterSchema: any = Schema.concat(ExtendedAdapterSchema)
