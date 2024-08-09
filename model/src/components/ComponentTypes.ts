import {ComponentTypes} from "@xgovformbuilder/model";
import {AdapterComponentDef} from "./types";

const NewComponents: AdapterComponentDef[] = [
    {
        name: "FreeTextField",
        //@ts-ignore
        type: "FreeTextField",
        title: "Free text field",
        subType: "field",
        hint: "",
        options: {},
        schema: {},
    },
    {
        name: "MultiInputField",
        type: "MultiInputField",
        title: "Multi input field",
        subType: "field",
        hint: "",
        options: {},
        schema: {},
        children: []
    }
]

export const AdapterComponentTypes: AdapterComponentDef[] = [...ComponentTypes, ...NewComponents]
