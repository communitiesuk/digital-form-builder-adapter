import React, {useContext, useRef, useState} from "react";
import {AdapterComponentContext} from "../../reducers/component/AdapterComponentReducer";
import {Flyout} from "../../../../digital-form-builder/designer/client/components/Flyout";
import {RenderInPortal} from "../../../../digital-form-builder/designer/client/components/RenderInPortal";
import {MultiInputFieldBaseEdit} from "./MultiInputFieldBaseEdit";
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
        if (selectedComponent.tempSubComponent.type === "RadiosField") {
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
            //@ts-ignore
        }
        //@ts-ignore
        else if (selectedComponent.tempSubComponent.type === "TextField") {
            //@ts-ignore
            let subComponents = selectedComponent.children.filter(component => component.name === selectedComponent.tempSubComponent.name);
            if (subComponents.length > 0) {
                const component: MultiInputFieldTypes = subComponents[0]

                if (component.options) {
                    component.options = {
                        ...component.options
                    }
                } else {
                    component.options = {}
                }


                if (component.schema) {
                    component.schema = {
                        ...component.options
                    }

                } else {
                    component.schema = {
                        ...component.options
                    }
                }

                //@ts-ignore
                if (selectedComponent.options.maxWords) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        maxWords: parseInt(selectedComponent.options.maxWords),
                    }
                }
                //@ts-ignore
                if (selectedComponent.options.autocomplete) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        autocomplete: selectedComponent.options.autocomplete,
                    }
                }
                //@ts-ignore
                if (selectedComponent.options.classes) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        classes: selectedComponent.options.classes,
                    }
                }


                //@ts-ignore
                if (selectedComponent.schema.length) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        length: parseInt(selectedComponent.schema.length),
                    }
                }
                //@ts-ignore
                if (selectedComponent.schema.max) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        max: parseInt(selectedComponent.schema.max),
                    }
                }
                //@ts-ignore
                if (selectedComponent.schema.min) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        min: parseInt(selectedComponent.schema.min),
                    }
                }
                //@ts-ignore
                if (selectedComponent.schema.regex) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        regex: selectedComponent.schema.regex,
                    }
                }


                //@ts-ignore
                deleteComponentByName(selectedComponent.tempSubComponent.name)
                //@ts-ignore
                delete selectedComponent.options.maxWords
                //@ts-ignore
                delete selectedComponent.options.autocomplete
                //@ts-ignore
                delete selectedComponent.options.classes
                //@ts-ignore
                delete selectedComponent.schema.length
                //@ts-ignore
                delete selectedComponent.schema.max
                //@ts-ignore
                delete selectedComponent.schema.min
                //@ts-ignore
                delete selectedComponent.schema.regex
                //@ts-ignore
                delete selectedComponent.tempSubComponent

                if (selectedComponent.options && Object.keys(selectedComponent.options).length === 0) {
                    delete selectedComponent.options
                }

                if (selectedComponent.schema) {
                    delete selectedComponent.schema
                }

                //@ts-ignore
                selectedComponent.children = selectedChildComponents
                setSelectedChildComponents([])
                //@ts-ignore
                setSelectedChildComponents(selectedComponent.children)
            }
            //@ts-ignore
        }
        //@ts-ignore
        else if (selectedComponent.tempSubComponent.type === "NumberField") {
            //@ts-ignore
            let subComponents = selectedComponent.children.filter(component => component.name === selectedComponent.tempSubComponent.name);
            if (subComponents.length > 0) {
                const component: MultiInputFieldTypes = subComponents[0]

                if (component.options) {
                    component.options = {
                        ...component.options
                    }
                } else {
                    component.options = {}
                }


                if (component.schema) {
                    component.schema = {
                        ...component.schema
                    }
                } else {
                    component.schema = {}
                }

                //@ts-ignore
                if (selectedComponent.options.prefix) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        prefix: selectedComponent.options.prefix,
                    }
                }
                //@ts-ignore
                if (selectedComponent.options.sufix) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        sufix: selectedComponent.options.sufix,
                    }
                }
                //@ts-ignore
                if (selectedComponent.options.classes) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        classes: selectedComponent.options.classes,
                    }
                }


                //@ts-ignore
                if (selectedComponent.schema.max) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        max: parseInt(selectedComponent.schema.max),
                    }
                }
                //@ts-ignore
                if (selectedComponent.schema.min) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        min: parseInt(selectedComponent.schema.min),
                    }
                }
                //@ts-ignore
                if (selectedComponent.schema.precision) {
                    //@ts-ignore
                    component.schema = {
                        //@ts-ignore
                        ...component.schema,
                        //@ts-ignore
                        precision: selectedComponent.schema.precision,
                    }
                }


                //@ts-ignore
                deleteComponentByName(selectedComponent.tempSubComponent.name)
                //@ts-ignore
                delete selectedComponent.options.prefix
                //@ts-ignore
                delete selectedComponent.options.suffix
                //@ts-ignore
                delete selectedComponent.options.classes
                //@ts-ignore
                delete selectedComponent.schema.max
                //@ts-ignore
                delete selectedComponent.schema.min
                //@ts-ignore
                delete selectedComponent.schema.precision
                //@ts-ignore
                delete selectedComponent.tempSubComponent

                if (selectedComponent.options && Object.keys(selectedComponent.options).length === 0) {
                    delete selectedComponent.options
                }

                if (selectedComponent.schema) {
                    delete selectedComponent.schema
                }

                //@ts-ignore
                selectedComponent.children = selectedChildComponents
                setSelectedChildComponents([])
                //@ts-ignore
                setSelectedChildComponents(selectedComponent.children)
            }
        }
        //@ts-ignore
        else if (selectedComponent.tempSubComponent.type === "DatePartsField") {
            //@ts-ignore
            let subComponents = selectedComponent.children.filter(component => component.name === selectedComponent.tempSubComponent.name);
            if (subComponents.length > 0) {
                const component: MultiInputFieldTypes = subComponents[0]

                if (component.options) {
                    component.options = {
                        ...component.options
                    }
                } else {
                    component.options = {}
                }


                if (component.schema) {
                    component.schema = {
                        ...component.schema
                    }
                } else {
                    component.schema = {}
                }

                //@ts-ignore
                if (selectedComponent.options.maxDaysInFuture) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        maxDaysInFuture: selectedComponent.options.maxDaysInFuture,
                    }
                }
                //@ts-ignore
                if (selectedComponent.options.maxDaysInPast) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        maxDaysInPast: selectedComponent.options.maxDaysInPast,
                    }
                }
                //@ts-ignore
                if (selectedComponent.options.classes) {
                    //@ts-ignore
                    component.options = {
                        //@ts-ignore
                        ...component.options,
                        //@ts-ignore
                        classes: selectedComponent.options.classes,
                    }
                }


                //@ts-ignore
                deleteComponentByName(selectedComponent.tempSubComponent.name)
                //@ts-ignore
                delete selectedComponent.options.maxDaysInFuture
                //@ts-ignore
                delete selectedComponent.options.maxDaysInPast
                //@ts-ignore
                delete selectedComponent.options.classes
                //@ts-ignore
                delete selectedComponent.tempSubComponent

                if (selectedComponent.options && Object.keys(selectedComponent.options).length === 0) {
                    delete selectedComponent.options
                }

                if (selectedComponent.schema) {
                    delete selectedComponent.schema
                }

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
        } else if (updateSubComponent.type === "TextField" || updateSubComponent.type === "NumberField" || updateSubComponent.type === "DatePartsField") {
            //@ts-ignore
            if (updateSubComponent.options) {
                selectedComponent.options = updateSubComponent.options
            }
            if (updateSubComponent.schema) {
                selectedComponent.schema = updateSubComponent.schema
            }

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
