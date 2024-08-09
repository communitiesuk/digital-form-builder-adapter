import React, {useContext, useRef, useState} from "react";
import {AdapterComponentContext} from "../../reducers/component/AdapterComponentReducer";
import {Flyout} from "../../../../digital-form-builder/designer/client/components/Flyout";
import {RenderInPortal} from "../../../../digital-form-builder/designer/client/components/RenderInPortal";
import {MultiInputFieldBaseEdit} from "../../MultiInputFieldBaseEdit";
import {
    DatePartsFieldFieldComponent,
    MonthYearFieldComponent, NumberFieldComponent, RadiosFieldComponent, TextFieldComponent,
    UkAddressFieldComponent, WebsiteFieldComponent,
    YesNoFieldComponent
} from "@xgovformbuilder/model";
import {
    NumberFieldEdit
} from "../../../../digital-form-builder/designer/client/components/FieldEditors/number-field-edit";
import ListFieldEdit from "../../../../digital-form-builder/designer/client/components/FieldEditors/list-field-edit";
import {DateFieldEdit} from "../../../../digital-form-builder/designer/client/components/FieldEditors/date-field-edit";
import randomId from "../../../../digital-form-builder/designer/client/randomId";
import {TextFieldEdit} from "../../../../digital-form-builder/designer/client/components/FieldEditors/text-field-edit";

export type MultiInputFieldTypes =
    YesNoFieldComponent
    | DatePartsFieldFieldComponent
    | MonthYearFieldComponent
    | UkAddressFieldComponent
    | TextFieldComponent
    | NumberFieldComponent
    | WebsiteFieldComponent
    | RadiosFieldComponent;

export const MoreSettingsEditorTypes: any = {
    TextField: TextFieldEdit,
    NumberField: NumberFieldEdit,
    RadiosField: ListFieldEdit,
    DatePartsField: DateFieldEdit,
};

export const MultiInputFieldEdit: any = ({context = AdapterComponentContext}) => {
    //@ts-ignore
    const {state, dispatch} = useContext(context);
    const {selectedComponent} = state;
    //@ts-ignore
    const {options = {}} = selectedComponent;
    // temp state management
    //@ts-ignore
    const [selectedChildComponents, setSelectedChildComponents] = useState(selectedComponent.children ? selectedComponent.children : []);
    const [selectedComponentType, setSelectedComponentType] = useState("");
    const [selectedSubComponent, setSelectedSubComponent] = useState<MultiInputFieldTypes>();

    const [showEditor, setShowEditor] = useState(false);
    const subComponentRef = useRef(null);

    const toggleShowEditor = () => {
        setShowEditor(!showEditor);
        if (showEditor) {
            setSelectedComponentType("Clear")
        }
    };

    const deleteComponentByName = (componentName: string) => {
        //@ts-ignore
        selectedComponent.children = selectedComponent.children.filter(component => component.name !== componentName);
        setSelectedChildComponents([])
        //@ts-ignore
        setSelectedChildComponents(selectedComponent.children)
    }

    //@ts-ignore
    if (selectedComponent.tempSubComponent) {
        //@ts-ignore
        if (selectedComponent.list) {
            //@ts-ignore
            let subComponent = selectedComponent.children.filter(component => component.name === selectedComponent.tempSubComponent.name);
            if (subComponent.length > 0) {
                //@ts-ignore
                subComponent[0].list = selectedComponent.list
                //@ts-ignore
                deleteComponentByName(selectedComponent.tempSubComponent.name)
                //@ts-ignore
                delete selectedComponent.list
                //@ts-ignore
                delete selectedComponent.tempSubComponent
                //@ts-ignore
                selectedComponent.children = selectedChildComponents
                setSelectedChildComponents([])
                //@ts-ignore
                setSelectedChildComponents(selectedComponent.children)
            }
        }
    }

    const handleSubComponentSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        const selectedValue = e.currentTarget.value;
        setSelectedComponentType(selectedValue)
        //@ts-ignore
        if (!selectedComponent.children) {
            //@ts-ignore
            selectedComponent.children = []
        }
        toggleShowEditor()
    }

    const handleDataFromChild = (newSubComponent, updateStatus) => {
        if (updateStatus && updateStatus.status === "Delete") {
            deleteComponentByName(updateStatus.name)
        }
        //@ts-ignore
        if (!selectedComponent.tempSubComponent) {
            //@ts-ignore
            selectedComponent.tempSubComponent = {
                //@ts-ignore
                type: newSubComponent.type,
                //@ts-ignore
                name: newSubComponent.name,
            }
        }
        deleteComponentByName(newSubComponent.name)
        //@ts-ignore
        selectedComponent.children.push(newSubComponent)
        //@ts-ignore
        setSelectedChildComponents(selectedComponent.children)
        toggleShowEditor()
    }

    const handleClickInParent = () => {
        if (subComponentRef.current) {
            //@ts-ignore
            subComponentRef.current.triggerChildFunction();
        }
    }

    const renderSelectedSubComponentConfigEdit = () => {
        if (selectedComponentType && selectedComponentType !== "Clear") {
            let newSelectedSubComponent = undefined
            if (!selectedSubComponent) {
                // @ts-ignore
                newSelectedSubComponent = {
                    //@ts-ignore
                    type: selectedComponentType,
                    name: randomId(),
                    options: {},
                    title: "",
                    hint: "",
                    schema: ""
                }
            }

            const MoreSettings = MoreSettingsEditorTypes[selectedComponentType ?? ""];
            return (
                <RenderInPortal>
                    {showEditor && (
                        //@ts-ignore
                        <Flyout title={`${selectedSubComponent ? "Edit" : "Add"} ${selectedComponentType}`}
                                onHide={toggleShowEditor}>
                            <MultiInputFieldBaseEdit ref={subComponentRef}
                                                     sendDataToParent={handleDataFromChild}
                                                     selectedComponentType={selectedComponentType}
                                                     selectedSubComponent={selectedSubComponent ? selectedSubComponent : newSelectedSubComponent}/>
                            {MoreSettings && <MoreSettings/>}
                            <button className="govuk-button" type="button" onClick={handleClickInParent}>
                                {selectedSubComponent ? "Update" : "Add"}
                            </button>
                        </Flyout>
                    )}
                </RenderInPortal>
            );
        } else {
            return <></>;
        }
    }

    //@ts-ignore
    const handleSubComponentEdit = (updateSubComponent: MultiInputFieldTypes, event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        setSelectedComponentType(updateSubComponent.type)
        toggleShowEditor()
        setSelectedSubComponent(updateSubComponent)
        if (updateSubComponent.type === "RadiosField" && updateSubComponent.list) {
            //@ts-ignore
            selectedComponent.list = updateSubComponent.list
        }
    }

    //@ts-ignore
    const handleSubComponentDelete = (subComponent: MultiInputFieldTypes, event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        deleteComponentByName(subComponent.name)
    }

    const renderAddedSubComponents = () => {
        //@ts-ignore
        if (selectedChildComponents && selectedChildComponents.length > 0) {
            return (
                <table className="govuk-table">
                    <caption className="govuk-table__caption govuk-table__caption--m">
                        Sub Components list
                    </caption>
                    <thead className="govuk-table__head">
                    <tr className="govuk-table__row">
                        <th scope="col" className="govuk-table__header" key={"componentType"}>Component Type</th>
                        <th scope="col" className="govuk-table__header" key={"componentType"}>Component Title</th>
                        <th scope="col" className="govuk-table__header" key={"actionCol"}></th>
                    </tr>
                    </thead>
                    <tbody className="govuk-table__body">
                    {//@ts-ignore
                        selectedComponent.children.map((childComponent) => (
                            <tr className="govuk-table__row" key={childComponent.name}>
                                <td className="govuk-table__cell table__cell__noborder">
                                    {childComponent.type}
                                </td>
                                <td className="govuk-table__cell table__cell__noborder">
                                    {childComponent.title}
                                </td>
                                <td className="govuk-table__cell table__cell__noborder">
                                    <button type="button" className="govuk-button govuk-button--secondary"
                                            data-module="govuk-button"
                                            onClick={
                                                //@ts-ignore
                                                (event) => handleSubComponentEdit(childComponent, event)}>
                                        Edit
                                    </button>
                                    <button type="button" className="govuk-button govuk-button--warning"
                                            data-module="govuk-button"
                                            onClick={
                                                //@ts-ignore
                                                (event) => handleSubComponentDelete(childComponent, event)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            );
        } else {
            return (<div> No Data to Display </div>);
        }
    }

    return (
        <>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s" htmlFor="location">
                    Add child component
                </label>
                <div id="location-hint" className="govuk-hint">
                    here please add components that wanted to add into multi input field
                </div>
                <select value={selectedComponentType} className="govuk-select" id="location" name="select-field-type"
                        aria-describedby="location-hint"
                        onChange={handleSubComponentSelection}>
                    <option value={"Clear"}>Please select</option>
                    <option value={"TextField"}>Text Field</option>
                    <option value={"NumberField"}>Number Field</option>
                    <option value={"RadiosField"}>Radios Field</option>
                    <option value={"DatePartsField"}>Date Parts Field</option>
                    <option value={"MonthYearField"}>Month Year Field</option>
                    <option value={"YesNoField"}>Yes No Field</option>
                    <option value={"WebsiteField"}>Yes No Field</option>
                    <option value={"UkAddressField"}>Uk Address Field</option>
                </select>
            </div>
            {renderSelectedSubComponentConfigEdit()}
            {renderAddedSubComponents()}
        </>
    );
}
