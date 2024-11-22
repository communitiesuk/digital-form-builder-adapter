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
// @ts-ignore
import {Input} from "@govuk-jsx/input";
import {TextFieldEdit} from "../component-edit/TextFieldEdit";

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

enum MultiInputFieldAction {
    EDIT_OPTIONS_SAME_PAGE_DISPLAY_MODE = "EDIT_OPTIONS_SAME_PAGE_DISPLAY_MODE",
    EDIT_OPTIONS_SEPARATE_PAGE_DISPLAY_MODE = "EDIT_OPTIONS_SEPARATE_PAGE_DISPLAY_MODE",
    EDIT_OPTIONS_HIDE_ROW_TITLE = "EDIT_OPTIONS_HIDE_ROW_TITLE",
    EDIT_OPTIONS_SHOW_TABLE_TITLE = "EDIT_OPTIONS_SHOW_TABLE_TITLE",
    EDIT_OPTIONS_SHOW_TABLE_ITEM_NAME = "EDIT_OPTIONS_SHOW_TABLE_ITEM_NAME",
}

export const MultiInputFieldEdit: any = ({context = AdapterComponentContext}) => {
    //@ts-ignore
    const {state, dispatch} = useContext(context);
    const {selectedComponent} = state;
    //@ts-ignore
    const {options = {}} = selectedComponent;
    //@ts-ignore
    options.required = true
    //@ts-ignore
    selectedComponent.schema = !selectedComponent.schema ? {} : {
        ...selectedComponent.schema
    }
    const [pageOptions, setPageOptions] = useState({
        // @ts-ignore
        summaryDisplayMode: {
            //@ts-ignore
            samePage: (selectedComponent.pageOptions && selectedComponent.pageOptions.summaryDisplayMode) ? selectedComponent.pageOptions.summaryDisplayMode.samePage : true,
            //@ts-ignore
            separatePage: (selectedComponent.pageOptions && selectedComponent.pageOptions.summaryDisplayMode) ? selectedComponent.pageOptions.summaryDisplayMode.separatePage : false,
            //@ts-ignore
            hideRowTitles: (selectedComponent.pageOptions && selectedComponent.pageOptions.summaryDisplayMode) ? selectedComponent.pageOptions.summaryDisplayMode.hideRowTitles : false
        },
        customText: {
            //@ts-ignore
            samePageTitle: (selectedComponent.pageOptions && selectedComponent.pageOptions.customText.samePageTitle) ? selectedComponent.pageOptions.customText.samePageTitle : "",
            //@ts-ignore
            samePageTableItemName: (selectedComponent.pageOptions && selectedComponent.pageOptions.customText.samePageTableItemName) ? selectedComponent.pageOptions.customText.samePageTableItemName : ""
        }
    });
    //@ts-ignore
    selectedComponent.pageOptions = pageOptions;
    // temp state management
    //@ts-ignore
    const [selectedChildComponents, setSelectedChildComponents] = useState(() => {
        //@ts-ignore
        return selectedComponent.children
            //@ts-ignore
            ? selectedComponent.children.map((child, index) => ({
                ...child,
                order: index + 1, // Adding an `order` property starting from 1
            }))
            : [];
    });
    const [selectedComponentType, setSelectedComponentType] = useState("");
    const [selectedSubComponent, setSelectedSubComponent] = useState<MultiInputFieldTypes>();
    const [tableTitle, setTableTitle] = useState<string>("");
    //@ts-ignore
    const [tableTitles, setTableTitles] = useState<string[]>(options.columnTitles ? options.columnTitles : []);

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
        setSelectedChildComponents(
            //@ts-ignore
            selectedComponent.children
                //@ts-ignore
                ? selectedComponent.children.map((child, index) => ({
                    ...child,
                    order: index + 1, // Adding order
                }))
                : []
        );
    }

    function handleTextField() {
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
            if (selectedComponent.options && selectedComponent.options.maxWords) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    maxWords: parseInt(selectedComponent.options.maxWords),
                }
                //@ts-ignore
                delete selectedComponent.options.maxWords
            }
            //@ts-ignore
            if (selectedComponent.options && selectedComponent.options.autocomplete) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    autocomplete: selectedComponent.options.autocomplete,
                }
                //@ts-ignore
                delete selectedComponent.options.autocomplete
            }
            //@ts-ignore
            if (selectedComponent.options && selectedComponent.options.classes) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    classes: selectedComponent.options.classes,
                }
                //@ts-ignore
                delete selectedComponent.options.classes
            }
            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.length) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    length: parseInt(selectedComponent.schema.length),
                }
                //@ts-ignore
                delete selectedComponent.schema.length
            }
            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.max) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    max: parseInt(selectedComponent.schema.max),
                }
                //@ts-ignore
                delete selectedComponent.schema.max
            }
            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.min) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    min: parseInt(selectedComponent.schema.min),
                }
                //@ts-ignore
                delete selectedComponent.schema.min
            }
            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.regex) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    regex: selectedComponent.schema.regex,
                }
                //@ts-ignore
                delete selectedComponent.schema.regex
            }
            //@ts-ignore
            delete selectedComponent.tempSubComponent
            setSelectedChildComponents([])
            //@ts-ignore
            setSelectedChildComponents(
                //@ts-ignore
                selectedComponent.children
                    //@ts-ignore
                    ? selectedComponent.children.map((child, index) => ({
                        ...child,
                        order: index + 1, // Adding order
                    }))
                    : []
            );
        }
    }

    function handleNumberField() {
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
            if (selectedComponent.options && selectedComponent.options.prefix) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    prefix: selectedComponent.options.prefix,
                }
            }
            //@ts-ignore
            if (selectedComponent.options && selectedComponent.options.sufix) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    sufix: selectedComponent.options.sufix,
                }
            }
            //@ts-ignore
            if (selectedComponent.options && selectedComponent.options.classes) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    classes: selectedComponent.options.classes,
                }
            }


            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.max) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    max: parseInt(selectedComponent.schema.max),
                }
            }
            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.min) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    min: parseInt(selectedComponent.schema.min),
                }
            }
            //@ts-ignore
            if (selectedComponent.schema && selectedComponent.schema.precision) {
                //@ts-ignore
                component.schema = {
                    //@ts-ignore
                    ...component.schema,
                    //@ts-ignore
                    precision: selectedComponent.schema.precision,
                }
            }

            if (selectedComponent.options) {
                //@ts-ignore
                delete selectedComponent.options.prefix
                //@ts-ignore
                delete selectedComponent.options.suffix
                //@ts-ignore
                delete selectedComponent.options.classes
            }
            if (selectedComponent.schema) {
                //@ts-ignore
                delete selectedComponent.schema.max
                //@ts-ignore
                delete selectedComponent.schema.min
                //@ts-ignore
                delete selectedComponent.schema.precision
            }
            //@ts-ignore
            delete selectedComponent.tempSubComponent

            if (selectedComponent.options && Object.keys(selectedComponent.options).length === 0) {
                delete selectedComponent.options
            }

            if (selectedComponent.schema) {
                delete selectedComponent.schema
            }

            setSelectedChildComponents([])
            //@ts-ignore
            setSelectedChildComponents(
                //@ts-ignore
                selectedComponent.children
                    //@ts-ignore
                    ? selectedComponent.children.map((child, index) => ({
                        ...child,
                        order: index + 1, // Adding order
                    }))
                    : []
            );
        }
    }

    function handleDatePartField() {
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
            if (selectedComponent.options && selectedComponent.options.maxDaysInFuture) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    maxDaysInFuture: selectedComponent.options.maxDaysInFuture,
                }
            }
            //@ts-ignore
            if (selectedComponent.options && selectedComponent.options.maxDaysInPast) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    maxDaysInPast: selectedComponent.options.maxDaysInPast,
                }
            }
            //@ts-ignore
            if (selectedComponent.options && selectedComponent.options.classes) {
                //@ts-ignore
                component.options = {
                    //@ts-ignore
                    ...component.options,
                    //@ts-ignore
                    classes: selectedComponent.options.classes,
                }
            }

            if (selectedComponent.options) {
                //@ts-ignore
                delete selectedComponent.options.maxDaysInFuture
                //@ts-ignore
                delete selectedComponent.options.maxDaysInPast
                //@ts-ignore
                delete selectedComponent.options.classes
            }
            //@ts-ignore
            delete selectedComponent.tempSubComponent

            if (selectedComponent.options && Object.keys(selectedComponent.options).length === 0) {
                delete selectedComponent.options
            }

            if (selectedComponent.schema) {
                delete selectedComponent.schema
            }

            setSelectedChildComponents([])
            //@ts-ignore
            setSelectedChildComponents(
                //@ts-ignore
                selectedComponent.children
                    //@ts-ignore
                    ? selectedComponent.children.map((child, index) => ({
                        ...child,
                        order: index + 1, // Adding order
                    }))
                    : []
            );
        }
    }

    function handleRadioField() {
        //@ts-ignore
        if (selectedComponent.list) {
            //@ts-ignore
            let subComponent = selectedComponent.children.filter(component => component.name === selectedComponent.tempSubComponent.name);
            //@ts-ignore
            let subComponentState = selectedChildComponents.filter(component => component.name === selectedComponent.tempSubComponent.name);
            if (subComponent.length > 0) {
                //@ts-ignore
                subComponent[0].list = selectedComponent.list
                //@ts-ignore
                subComponentState[0].list = selectedComponent.list
                //@ts-ignore
                delete selectedComponent.list
                //@ts-ignore
                delete selectedComponent.tempSubComponent

                setSelectedChildComponents([])
                //@ts-ignore
                setSelectedChildComponents(
                    //@ts-ignore
                    selectedComponent.children
                        //@ts-ignore
                        ? selectedComponent.children.map((child, index) => ({
                            ...child,
                            order: index + 1, // Adding order
                        }))
                        : []
                );
            }
        }
    }

    //@ts-ignore
    if (selectedComponent.tempSubComponent) {
        //@ts-ignore
        if (selectedComponent.tempSubComponent.type === "RadiosField") {
            handleRadioField();
        }
        //@ts-ignore
        else if (selectedComponent.tempSubComponent.type === "TextField") {
            handleTextField();
        }
        //@ts-ignore
        else if (selectedComponent.tempSubComponent && selectedComponent.tempSubComponent.type === "NumberField") {
            handleNumberField();
        }
        //@ts-ignore
        else if (selectedComponent.tempSubComponent.type === "DatePartsField") {
            handleDatePartField();
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

    const addComponentAtIndex = (componentArray: any[], newComponent: any, index: number) => {
        if (index < 0) {
            throw new Error("Index out of bounds");
        }
        if (index > componentArray.length) {
            componentArray.push(newComponent);
        } else {
            componentArray.splice(index, 0, newComponent);
        }
    }

    const handleDataFromChild = (newSubComponent, updateStatus) => {
        //@ts-ignore
        let childComponentState = selectedChildComponents.filter(component => component.name === updateStatus.name);
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
        addComponentAtIndex(selectedComponent.children, newSubComponent, childComponentState.length <= 0 ? selectedComponent.children.length <= 0 ? 0 : selectedComponent.children.length + 1 : childComponentState[0].order - 1)
        //@ts-ignore
        setSelectedChildComponents(
            //@ts-ignore
            selectedComponent.children
                //@ts-ignore
                ? selectedComponent.children.map((child, index) => ({
                    ...child,
                    order: index + 1, // Adding order
                }))
                : []
        );
        toggleShowEditor()
    }

    const handleClickInParent = () => {
        if (subComponentRef.current) {
            //@ts-ignore
            subComponentRef.current.triggerChildFunction();
        }
    }

    const handleData = (e: { type: MultiInputFieldAction, payload: any }) => {
        if (e.type === MultiInputFieldAction.EDIT_OPTIONS_SEPARATE_PAGE_DISPLAY_MODE) {
            setPageOptions({
                ...pageOptions,
                summaryDisplayMode: {
                    ...pageOptions.summaryDisplayMode,
                    separatePage: e.payload,
                    samePage: !e.payload
                }
            })
        }
        if (e.type === MultiInputFieldAction.EDIT_OPTIONS_SAME_PAGE_DISPLAY_MODE) {
            setPageOptions({
                ...pageOptions,
                summaryDisplayMode: {
                    ...pageOptions.summaryDisplayMode,
                    samePage: e.payload,
                    separatePage: !e.payload
                }
            })
        }
        if (e.type === MultiInputFieldAction.EDIT_OPTIONS_HIDE_ROW_TITLE) {
            setPageOptions({
                ...pageOptions,
                summaryDisplayMode: {
                    ...pageOptions.summaryDisplayMode,
                    hideRowTitles: e.payload
                }
            })
        }
        if (e.type === MultiInputFieldAction.EDIT_OPTIONS_SHOW_TABLE_TITLE) {
            setPageOptions({
                ...pageOptions,
                //@ts-ignore
                customText: {
                    ...pageOptions.customText,
                    samePageTitle: e.payload,
                }
            })
        }
        if (e.type === MultiInputFieldAction.EDIT_OPTIONS_SHOW_TABLE_ITEM_NAME) {
            setPageOptions({
                ...pageOptions,
                //@ts-ignore
                customText: {
                    ...pageOptions.customText,
                    samePageTableItemName: e.payload,
                }
            })
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
                <div>
                    <RenderInPortal>
                        {showEditor && (
                            //@ts-ignore
                            <Flyout title={`${selectedSubComponent ? "Edit" : "Add"} ${selectedComponentType}`}
                                    onHide={toggleShowEditor}>
                                <MultiInputFieldBaseEdit ref={subComponentRef}
                                    //@ts-ignore
                                                         sendDataToParent={handleDataFromChild}
                                                         selectedComponentType={selectedComponentType}
                                                         selectedSubComponent={selectedSubComponent ? selectedSubComponent : newSelectedSubComponent}
                                                         id={"child-component"}/>
                                {MoreSettings && <div id={"child-component-more-settings"}><MoreSettings/></div>}
                                <button id={"child-component-button"} className="govuk-button" type="button"
                                        onClick={handleClickInParent}>
                                    {selectedSubComponent ? "Update" : "Add"}
                                </button>
                            </Flyout>
                        )}
                    </RenderInPortal>
                </div>
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
        return (
            <>
                <table className="govuk-table">
                    <thead className="govuk-table__head">
                    <tr className="govuk-table__row">
                        <th scope="col" className="govuk-table__header" key={"componentType"}>Order</th>
                        <th scope="col" className="govuk-table__header" key={"componentType"}>Component Type</th>
                        <th scope="col" className="govuk-table__header" key={"componentType"}>Component Title</th>
                        <th scope="col" className="govuk-table__header" key={"actionCol"}></th>
                    </tr>
                    </thead>
                    <tbody className="govuk-table__body">
                    {//@ts-ignore
                        selectedChildComponents && selectedChildComponents.length > 0 ? (selectedComponent.children.map((childComponent, index) => (
                            <tr className="govuk-table__row" key={'index'}>
                                <td className="govuk-table__cell table__cell__noborder">
                                    {index + 1}
                                </td>
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
                        ))) : (
                            <div className="govuk-form-group">
                                <div className="govuk-label--s">No Data to Display</div>
                            </div>
                        )}
                    </tbody>
                </table>
            </>
        );
    }


    const handleTableTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        setTableTitle(event.target.value)
    }

    const handleAddTableTitles = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        const titles = [...tableTitles, tableTitle]
        setTableTitles(titles)
        //@ts-ignore
        selectedComponent.options.columnTitles = titles
    }

    const handleDeleteTitle = (_tableTitle: string, event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        let restTitle = tableTitles.filter(title => _tableTitle !== title);
        setTableTitles(restTitle)
        //@ts-ignore
        selectedComponent.options.columnTitles = restTitle
    }

    return (
        <>
            <label className="govuk-label govuk-label--s">----- Multi Input Field Edit -----</label>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s" htmlFor="field-table-title">
                    Table title names
                </label>
                <input className="govuk-input" id="field-table-title" name="table-title" type="text"
                       onChange={handleTableTitle}/>
            </div>
            <div className="govuk-form-group">
                <button type="button" className="govuk-button govuk-button--secondary"
                        data-module="govuk-button"
                        onClick={
                            //@ts-ignore
                            (event) => handleAddTableTitles(event)}>
                    Add
                </button>
            </div>
            <div className="govuk-form-group">
                <table className="govuk-table">
                    <thead className="govuk-table__head">
                    <tr className="govuk-table__row">
                        <th scope="col" className="govuk-table__header" key={"componentType"}>Title</th>
                        <th scope="col" className="govuk-table__header" key={"actionCol"}></th>
                    </tr>
                    </thead>
                    <tbody className="govuk-table__body">
                    {//@ts-ignore
                        tableTitles.length > 0 ? (tableTitles.map((tableTitle) => (
                            <tr className="govuk-table__row" key={tableTitle}>
                                <td className="govuk-table__cell table__cell__noborder">
                                    {tableTitle}
                                </td>
                                <td className="govuk-table__cell table__cell__noborder">
                                    <button type="button" className="govuk-button govuk-button--warning"
                                            data-module="govuk-button"
                                            onClick={
                                                //@ts-ignore
                                                (event) => handleDeleteTitle(tableTitle, event)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))) : (
                            <div className="govuk-form-group">
                                <div className="govuk-label--s">No Data to Display</div>
                            </div>
                        )}
                    </tbody>
                </table>
            </div>


            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s" htmlFor="field-table-title">
                    Summary Display Mode Configurations
                </label>
                <span className="govuk-hint">In this option it will allow to display the data in the same page or different page but as a table view</span>
            </div>

            <div className="govuk-checkboxes govuk-form-group" data-test-id="field-options.optionalText-wrapper">
                <div className="govuk-checkboxes__item">
                    <input
                        className="govuk-checkboxes__input"
                        id="same-page-displayMode"
                        name="options.samePageDisplayMode"
                        type="checkbox"
                        onChange={(e) =>
                            handleData({
                                type: MultiInputFieldAction.EDIT_OPTIONS_SAME_PAGE_DISPLAY_MODE,
                                payload: e.target.checked,
                            })
                        }
                        checked={
                            //@ts-ignore
                            pageOptions.summaryDisplayMode.samePage
                        }
                    />
                    <label
                        className="govuk-label govuk-checkboxes__label"
                        htmlFor="same-page-displayMode"
                    >
                        No need to display content in the same page
                    </label>
                    <span className="govuk-hint govuk-checkboxes__hint">If you dont need to display the content in the same page please uncheck this checkbox </span>
                </div>
            </div>

            <div className="govuk-checkboxes govuk-form-group" data-test-id="page-display-mode-wrapper">
                <div className="govuk-checkboxes__item">
                    <input className="govuk-checkboxes__input" id="page-display-mode"
                           name="options.pageDisplayMode" type="checkbox"
                           onChange={(e) =>
                               handleData({
                                   type: MultiInputFieldAction.EDIT_OPTIONS_SEPARATE_PAGE_DISPLAY_MODE,
                                   payload: e.target.checked,
                               })
                           }
                           checked={
                               //@ts-ignore
                               pageOptions.summaryDisplayMode.separatePage
                           }
                    />
                    <label className="govuk-label govuk-checkboxes__label" htmlFor="page-display-mode">Separate
                        Page Display Mode
                    </label>
                    <span className="govuk-hint govuk-checkboxes__hint">If we need to show the ta in the separate page as a table</span>
                </div>
            </div>

            <div className="govuk-checkboxes govuk-form-group" data-test-id="hide-row-titles-wrapper">
                <div className="govuk-checkboxes__item">
                    <input className="govuk-checkboxes__input" id="hide-row-titles"
                           name="options.hideRowTitles" type="checkbox"
                           onChange={(e) =>
                               handleData({
                                   type: MultiInputFieldAction.EDIT_OPTIONS_HIDE_ROW_TITLE,
                                   payload: e.target.checked,
                               })
                           }
                           checked={
                               //@ts-ignore
                               pageOptions.summaryDisplayMode.hideRowTitles
                           }
                    />
                    <label className="govuk-label govuk-checkboxes__label" htmlFor="hide-row-titles">Hide row
                        titles</label>
                    <span className="govuk-hint govuk-checkboxes__hint">If row titles need to hide on the table</span>
                </div>
            </div>

            <div className="govuk-form-group" data-test-id="table-title-wrapper">
                <Input id="table-title" name="tableTitle"
                       onChange={(e) =>
                           handleData({
                               type: MultiInputFieldAction.EDIT_OPTIONS_SHOW_TABLE_TITLE,
                               payload: e.target.value,
                           })
                       }
                       value={pageOptions.customText.samePageTitle || ""}
                       label={{
                           className: "govuk-label--s",
                           children: ["Table title"]
                       }}/>
            </div>

            <div className="govuk-form-group" data-test-id="table-title-wrapper">
                <Input id="table-item-name" name="tableTitleName"
                       onChange={(e) =>
                           handleData({
                               type: MultiInputFieldAction.EDIT_OPTIONS_SHOW_TABLE_ITEM_NAME,
                               payload: e.target.value,
                           })
                       }
                       value={pageOptions.customText.samePageTableItemName || ""}
                       label={{
                           className: "govuk-label--s",
                           children: ["Table Item Name"]
                       }}/>
            </div>
            <div className="govuk-label govuk-label--s">----- Sub Components list -----</div>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s" htmlFor="select-field-types">
                    Add child component
                </label>
                <div id="location-hint" className="govuk-hint">
                    here please add components that wanted to add into multi input field
                </div>
                <select value={selectedComponentType} className="govuk-select" id="select-field-types"
                        name="field-type"
                        aria-describedby="location-hint"
                    //@ts-ignore
                        onChange={handleSubComponentSelection}>
                    <option value={"Clear"}>Please select</option>
                    <option value={"TextField"}>Text Field</option>
                    <option value={"MultilineTextField"}>Multiline Text Field</option>
                    <option value={"NumberField"}>Number Field</option>
                    <option value={"RadiosField"}>Radios Field</option>
                    <option value={"DatePartsField"}>Date Parts Field</option>
                    <option value={"MonthYearField"}>Month Year Field</option>
                    <option value={"YesNoField"}>Yes No Field</option>
                    <option value={"WebsiteField"}>Website Field</option>
                    <option value={"UkAddressField"}>Uk Address Field</option>
                </select>
            </div>
            {renderSelectedSubComponentConfigEdit()}
            {renderAddedSubComponents()}
        </>
    );
}
