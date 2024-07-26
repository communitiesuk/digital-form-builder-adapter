import {ComponentDef, ComponentTypes} from "@xgovformbuilder/model";

const NewComponents: ComponentDef[] = [
    {
        name: "FreeTextField",
        //@ts-ignore
        type: "FreeTextField",
        title: "Free text field",
        subType: "field",
        hint: "",
        options: {},
        schema: {},
    }
]

export const AdapterComponentTypes: ComponentDef[] = [...ComponentTypes, ...NewComponents]
