import React, {memo, useContext, useLayoutEffect} from "react";
import {AdapterComponentTypeEnum as Types} from "@communitiesuk/model";
import {hasValidationErrors} from "../../../../digital-form-builder/designer/client/validations";
import {Actions} from "../../../../digital-form-builder/designer/client/reducers/component/types";
import {updateComponent} from "../../../../digital-form-builder/designer/client/data";
import ErrorSummary from "../../../../digital-form-builder/designer/client/error-summary";
import {AdapterComponentTypeEdit} from "./AdapterComponentTypeEdit";
import {AdapterComponentContext} from "../../reducers/component/AdapterComponentReducer";
import {AdapterDataContext} from "../../context/AdapterDataContext";


const LIST_TYPES = [
    Types.AutocompleteField,
    Types.List,
    Types.RadiosField,
    Types.SelectField,
    Types.YesNoField,
    Types.FlashCard,
];

const AdapterComponentEdit = (props) => {
    const {data, save} = useContext(AdapterDataContext);
    const {state, dispatch} = useContext(AdapterComponentContext);
    //@ts-ignore
    const {selectedComponent, initialName, errors = {}, hasValidated, selectedListName} = state;
    const {page, toggleShowEditor} = props;
    const hasErrors = hasValidationErrors(errors);
    const componentToSubmit = {...selectedComponent};

    useLayoutEffect(() => {
        if (hasValidated && !hasErrors) {
            //@ts-ignore
            handleSubmit();
        }
    }, [hasValidated]);

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!hasValidated) {
            dispatch({type: Actions.VALIDATE});
            return;
        }

        if (hasErrors) {
            return;
        }

        if (LIST_TYPES.includes(selectedComponent.type)) {
            if (selectedListName !== "static") {
                // @ts-ignore
                componentToSubmit.values = {
                    type: "listRef",
                    list: selectedListName,
                };
                // @ts-ignore
                delete componentToSubmit.items;
            } else {
                // @ts-ignore
                componentToSubmit.values.valueType = "static";
            }
        }

        // @ts-ignore
        const updatedData = updateComponent(data, page.path, initialName, componentToSubmit);
        await save(updatedData);
        toggleShowEditor();
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        const copy = {...data};
        const indexOfPage = copy.pages.findIndex((p) => p.path === page.path);
        // @ts-ignore
        const indexOfComponent = copy.pages[indexOfPage]?.components.findIndex(
            (component) => component.name === selectedComponent.name
        );
        // @ts-ignore
        copy.pages[indexOfPage].components.splice(indexOfComponent, 1);
        await save(copy);
        toggleShowEditor();
    };

    return (
        <>
            {hasErrors && <ErrorSummary errorList={Object.values(errors)}/>}
            <form autoComplete="off" onSubmit={handleSubmit}>
                <AdapterComponentTypeEdit page={page}/>
                <button className="govuk-button" type="submit">
                    Save
                </button>
                {" "}
                <a href="#" onClick={handleDelete} className="govuk-link">
                    Delete
                </a>
            </form>
        </>
    );
}

export default memo(AdapterComponentEdit);
