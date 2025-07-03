import {AdapterComponentContext} from "../../reducers/component/AdapterComponentReducer";
// @ts-ignore
import React, {useContext, useState} from "react";


const EDIT_NO_SCRIPT_WARNING = "EDIT_NO_SCRIPT_WARNING";
const EDIT_MINIMUM_REQUIRED_FILES = "EDIT_MINIMUM_REQUIRED_FILES";
const OPTIONS_MAX_FILES = "OPTIONS_MAX_FILES";
const OPTIONS_MAX_PARALLEL_UPLOAD_FILES = "OPTIONS_MAX_PARALLEL_UPLOAD_FILES";
const OPTIONS_MAX_FILES_SIZE = "OPTIONS_MAX_FILES_SIZE";

const ALLOWED_FILE_TYPES: string[] = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vndopenxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.oasis.opendocument.spreadsheet"
];

export const ClientSideFileUploadFieldEdit: any = ({context = AdapterComponentContext}) => {
    const {state} = useContext(context);
    const {selectedComponent} = state;

    if (selectedComponent.options && Object.keys(selectedComponent.options).length == 0) {
        selectedComponent.options = {
            dropzoneConfig: {
                maxFiles: 1,
                parallelUploads: 1,
                maxFilesize: 10,
                acceptedFiles: "",
            },
            showNoScriptWarning: false,
            minimumRequiredFiles: 0,
        }
    }

    const [component, setComponent] = useState({...selectedComponent});

    const handleOnchangeEvent = (value) => {
        if (value.type === EDIT_NO_SCRIPT_WARNING) {
            setComponent(
                //@ts-ignore
                {
                    ...component,
                    options: {
                        ...component.options,
                        showNoScriptWarning: !component.options.showNoScriptWarning
                    },
                }
            )
            //@ts-ignore
            selectedComponent.options.showNoScriptWarning = updatedComponent.options.showNoScriptWarning
        } else if (value.type === EDIT_MINIMUM_REQUIRED_FILES) {
            setComponent(
                //@ts-ignore
                {
                    ...component,
                    options: {
                        ...component.options,
                        minimumRequiredFiles: parseInt(value.payload)
                    },
                }
            )
            //@ts-ignore
            selectedComponent.options.minimumRequiredFiles = parseInt(value.payload)
        } else if (value.type === OPTIONS_MAX_FILES) {
            setComponent(
                //@ts-ignore
                {
                    ...component,
                    options: {
                        ...component.options,
                        dropzoneConfig: {
                            ...component.options.dropzoneConfig,
                            maxFiles: parseInt(value.payload)
                        }

                    }
                }
            )
            //@ts-ignore
            selectedComponent.options.dropzoneConfig = {
                ...component.options.dropzoneConfig,
                maxFiles: parseInt(value.payload)
            }
        } else if (value.type === OPTIONS_MAX_PARALLEL_UPLOAD_FILES) {
            setComponent(
                //@ts-ignore
                {
                    ...component,
                    options: {
                        ...component.options,
                        dropzoneConfig: {
                            ...component.options.dropzoneConfig,
                            parallelUploads: parseInt(value.payload)
                        }

                    }
                }
            )
            //@ts-ignore
            selectedComponent.options.dropzoneConfig = {
                ...component.options.dropzoneConfig,
                parallelUploads: parseInt(value.payload)
            }
        } else if (value.type === OPTIONS_MAX_FILES_SIZE) {
            setComponent(
                //@ts-ignore
                {
                    ...component,
                    options: {
                        ...component.options,
                        dropzoneConfig: {
                            ...component.options.dropzoneConfig,
                            maxFilesize: parseInt(value.payload)
                        }

                    }
                }
            )
            //@ts-ignore
            selectedComponent.options.dropzoneConfig = {
                ...component.options.dropzoneConfig,
                maxFilesize: parseInt(value.payload)
            }
        }
    }

    // Handle change in checkbox selection
    const handleCheckboxChange = (e) => {
        const item = e.target.value;
        const acceptedFilesArr = component.options.dropzoneConfig.acceptedFiles.split(",")
        const isItemSelected = acceptedFilesArr.includes(item);
        // Create new array - either add or remove item
        const updatedAcceptedFiles = isItemSelected
            ? acceptedFilesArr.filter(file => file !== item)
            : [...acceptedFilesArr, item];
        setComponent(
            //@ts-ignore
            {
                ...component,
                options: {
                    ...component.options,
                    dropzoneConfig: {
                        ...component.options.dropzoneConfig,
                        acceptedFiles: updatedAcceptedFiles.join(",")
                    }
                }
            }
        );
        //@ts-ignore
        selectedComponent.options.dropzoneConfig.acceptedFiles = updatedAcceptedFiles.join(",");
    };

    return (
        <>
            <div className="govuk-form-group">
                <div className="govuk-checkboxes govuk-form-group">
                    <div className="govuk-checkboxes__item">
                        <input
                            className="govuk-checkboxes__input"
                            id="show-no-script-warning"
                            name="showNoScriptWarning"
                            type="checkbox"
                            checked={component.options.showNoScriptWarning}
                            onChange={(e) =>
                                handleOnchangeEvent({
                                    type: EDIT_NO_SCRIPT_WARNING,
                                    payload: e.target.value,
                                })
                            }
                        />
                        <label className="govuk-label govuk-checkboxes__label" htmlFor="show-no-script-warning">
                            Show no script warning
                        </label>
                        <span className="govuk-hint govuk-checkboxes__hint">
                            If users need to show the warning of usage of java script while using this component please check this box.
                        </span>
                    </div>
                </div>
            </div>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s">
                    Minimum required files count
                </label>
                <span className="govuk-hint">
                                Number of required files count needed to be in the component.
                            </span>
                <input
                    className="govuk-input govuk-input--width-3"
                    data-cast="number"
                    id="minimumRequiredFiles"
                    name="minimumRequiredFiles"
                    value={
                        //@ts-ignore
                        component.options.minimumRequiredFiles}
                    type="number"
                    onChange={(e) => handleOnchangeEvent({
                        type: EDIT_MINIMUM_REQUIRED_FILES,
                        payload: e.target.value,
                    })}
                />

            </div>
            <label className="govuk-label govuk-label--s">
                Dropzone Configurations
            </label>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s">
                    Max file count
                </label>
                <span className="govuk-hint">
                                Number of required files count needed to be in the component.
                </span>
                <input
                    className="govuk-input govuk-input--width-3"
                    data-cast="number"
                    id="options.dropzoneConfig.maxFiles"
                    name="options.dropzoneConfig.maxFiles"
                    value={
                        //@ts-ignore
                        component.options.dropzoneConfig.maxFiles}
                    type="number"
                    onChange={(e) => handleOnchangeEvent({
                        type: OPTIONS_MAX_FILES,
                        payload: e.target.value,
                    })}
                />

            </div>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s">
                    Parallel file upload count
                </label>
                <span className="govuk-hint">
                    Number of parallel files that needed to be uploaded using this component.
                </span>
                <input
                    className="govuk-input govuk-input--width-3"
                    data-cast="number"
                    id="options.dropzoneConfig.parallelUploads"
                    name="options.dropzoneConfig.parallelUploads"
                    value={
                        //@ts-ignore
                        component.options.dropzoneConfig.parallelUploads}
                    type="number"
                    onChange={(e) => handleOnchangeEvent({
                        type: OPTIONS_MAX_PARALLEL_UPLOAD_FILES,
                        payload: e.target.value,
                    })}
                />
            </div>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s">
                    Maximum file size allowed to upload
                </label>
                <span className="govuk-hint">
                    What is the maximum file size that allowed to upload from this component.
                </span>
                <input
                    className="govuk-input govuk-input--width-3"
                    data-cast="number"
                    id="options.dropzoneConfig.maxFilesize"
                    name="options.dropzoneConfig.maxFilesize"
                    value={
                        //@ts-ignore
                        component.options.dropzoneConfig.maxFilesize}
                    type="number"
                    onChange={(e) => handleOnchangeEvent({
                        type: OPTIONS_MAX_FILES_SIZE,
                        payload: e.target.value,
                    })}
                />
            </div>
            <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s">
                    Select allowed file types
                </label>
                <span className="govuk-hint">
                    What type of files are allowed to upload from this component.
                </span>
                <ul className="govuk-list">
                    {ALLOWED_FILE_TYPES.map((item) => (
                        <li key={item}>
                            <div className="govuk-checkboxes__item">
                                <input
                                    className="govuk-checkboxes__input"
                                    id={`file-type-item-${item}`}
                                    name="showNoScriptWarning"
                                    type="checkbox"
                                    value={item}
                                    onChange={handleCheckboxChange}
                                    checked={component.options.dropzoneConfig.acceptedFiles.split(",").includes(item)}
                                />
                                <label className="govuk-label govuk-checkboxes__label"
                                       htmlFor={`file-type-item-${item}`}>
                                    {item}
                                </label>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
