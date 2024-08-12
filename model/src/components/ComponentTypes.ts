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
    },
    {
        name: "ClientSideFileUploadField",
        //@ts-ignore
        type: "ClientSideFileUploadField",
        title: "Client side file upload field",
        subType: "field",
        hint: "",
        options: {
            //@ts-ignore
            dropzoneConfig: {},
            showNoScriptWarning: false,
            minimumRequiredFiles: 0,
            totalOverallFilesize: 0,
            required: false,
            optionalText: false,
        },
        schema: {},
    }
]

export const AdapterComponentTypes: AdapterComponentDef[] = [...ComponentTypes, ...NewComponents]
