import React, {useState} from "react";
import {componentTypes} from "../../digital-form-builder/designer/client/component";
import {Flyout} from "../../digital-form-builder/designer/client/components/Flyout";
import {ComponentContextProvider} from "../../digital-form-builder/designer/client/reducers/component";
import {i18n} from "../../digital-form-builder/designer/client/i18n";
import AdapterComponentEdit from "./AdapterComponentEdit";

export const adapterComponentTypes: any = {
    ...componentTypes,
    FreeTextField,
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
                    <ComponentContextProvider pagePath={page.path} component={component}>
                        <AdapterComponentEdit page={page} toggleShowEditor={toggleShowEditor}/>
                    </ComponentContextProvider>
                </Flyout>
            )}
        </div>
    );
}
