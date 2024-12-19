import {renderFieldEdit} from "../component-edit/AdapterFieldEdit";
import {Actions} from "../../../../digital-form-builder/designer/client/reducers/component/types";
import {useState} from "react";
import React from "react";
import {MultiInputFieldTypes} from "./MultiInputFieldEdit";


export const MultiInputFieldBaseEdit = React.forwardRef((props, ref: any) => {
        //@ts-ignore
        let selectedSubComponent = props.selectedSubComponent;
        //@ts-ignore
        let oldName = ""
        //@ts-ignore
        oldName = props.selectedSubComponent.name

        const [selectedSubComponentEdit, setSelectedSubComponentEdit] =
            //@ts-ignore
            useState<MultiInputFieldTypes>(selectedSubComponent);

        let errors;
        // @ts-ignore
        const {name, title, hint, attrs, type, options = {}} = selectedSubComponentEdit;
        const {
            //@ts-ignore
            hideTitle = false,
            //@ts-ignore
            optionalText = true,
            //@ts-ignore
            required = true,
            exposeToContext = false,
            disableChangingFromSummary = false,
        } = options;


        React.useImperativeHandle(ref, () => ({
            triggerChildFunction: handleClickInChild
        }))

        const handleClickInChild = () => {
            if (oldName) {
                //@ts-ignore
                props.sendDataToParent(selectedSubComponentEdit, {
                    name: oldName,
                    status: selectedSubComponentEdit.name === oldName ? "NoChange" : "Delete"
                });
            } else {
                //@ts-ignore
                props.sendDataToParent(selectedSubComponentEdit);
            }
        }

        const handleData = (event) => {
            if (event.type === Actions.EDIT_TITLE) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    title: event.payload
                })
            } else if (event.type === Actions.EDIT_OPTIONS_HIDE_OPTIONAL) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    //@ts-ignore
                    options: {
                        ...options,
                        //@ts-ignore
                        optionalText: event.payload
                    }
                })
            } else if (event.type === Actions.EDIT_HELP) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    //@ts-ignore
                    hint: event.payload
                })
            } else if (event.type === Actions.EDIT_OPTIONS_HIDE_TITLE) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    options: {
                        ...options,
                        //@ts-ignore
                        hideTitle: event.payload
                    }
                })
            } else if (event.type === Actions.EDIT_NAME) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    name: event.payload
                })
            } else if (event.type === Actions.EDIT_OPTIONS_REQUIRED) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    options: {
                        ...options,
                        //@ts-ignore
                        required: event.payload
                    }
                })
            } else if (event.type === Actions.EDIT_OPTIONS_EXPOSE_TO_CONTEXT) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    options: {
                        ...options,
                        //@ts-ignore
                        exposeToContext: event.payload
                    }
                })
            } else if (event.type === Actions.EDIT_OPTIONS_DISABLE_CHANGING_FROM_SUMMARY) {
                setSelectedSubComponentEdit({
                    ...selectedSubComponentEdit,
                    options: {
                        ...options,
                        //@ts-ignore
                        disableChangingFromSummary: event.payload
                    }
                })
            }
        }

        return (
            <div>
                {renderFieldEdit(
                    selectedSubComponentEdit.title,
                    handleData,
                    errors,
                    //@ts-ignore
                    selectedSubComponentEdit.hint,
                    attrs,
                    hideTitle,
                    name,
                    false,
                    false,
                    required,
                    type,
                    optionalText,
                    exposeToContext,
                    false,
                    false,
                    false,
                    disableChangingFromSummary,
                    //@ts-ignore
                    props.id)}
            </div>
        );
    }
)
