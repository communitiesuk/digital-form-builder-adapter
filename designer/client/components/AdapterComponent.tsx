import React, {useState} from "react";
import {componentTypes} from "../../../digital-form-builder/designer/client/component";
import {Flyout} from "../../../digital-form-builder/designer/client/components/Flyout";
import {i18n} from "../i18n";
import {AdapterComponentContextProvider} from "../reducers/component/AdapterComponentReducer";
import AdapterComponentEdit from "./component-edit/AdapterComponentEdit";

export const adapterComponentTypes: any = {
    ...componentTypes,
    FreeTextField,
    MultiInputField,
    ClientSideFileUploadField
}

export const Base = (props) => {
    return <div>{props.children}</div>;
}

export const ComponentField = (props) => {
    return <Base>{props.children}</Base>;
}

function FreeTextField() {
    return (
        <ComponentField>
            <span className="box tall thick-top-border"/>
        </ComponentField>
    );
}

function MultiInputField() {
    return (
        <ComponentField>
            <span className="box tall thick-top-border"/>
        </ComponentField>
    );
}

function ClientSideFileUploadField() {
    return (
        <ComponentField>
            <span className="box tall thick-top-border"/>
        </ComponentField>
    );
}

export const AdapterComponent = (props) => {
    const [showEditor, setShowEditor] = useState();
    const toggleShowEditor = (value) => {
        setShowEditor(value ?? !showEditor);
    };
    const {page, component} = props;
    const TagName = adapterComponentTypes[`${component.type}`];
    const editFlyoutTitle = i18n("component.edit", {
        name: i18n(`fieldTypeToName.${component.type}`),
    });

    return (
        <div>
            <div className="component govuk-!-padding-2" onClick={toggleShowEditor}>
                <TagName/>
            </div>
            {showEditor && (
                <Flyout title={editFlyoutTitle} show={true} onHide={toggleShowEditor}>
                    <AdapterComponentContextProvider pagePath={page.path} component={component}>
                        <AdapterComponentEdit page={page} toggleShowEditor={toggleShowEditor}/>
                    </AdapterComponentContextProvider>
                </Flyout>
            )}
        </div>
    );
}
