import React, {
    useEffect,
    useContext,
    useState,
    useLayoutEffect,
    FormEvent,
} from "react";
import "../../../../digital-form-builder/designer/client/components/ComponentCreate/ComponentCreate.scss";
import {hasValidationErrors} from "../../../../digital-form-builder/designer/client/validations";
import {Actions} from "../../../../digital-form-builder/designer/client/reducers/component/types";
import logger from "../../../../digital-form-builder/designer/client/plugins/logger";
import {addComponent} from "../../../../digital-form-builder/designer/client/data";
import {AdapterComponentDef, AdapterPage} from "@communitiesuk/model";
import {i18n} from "../../../../digital-form-builder/designer/client/i18n";
import {BackLink} from "../../../../digital-form-builder/designer/client/components/BackLink";
import ErrorSummary from "../../../../digital-form-builder/designer/client/error-summary";
import {AdapterComponentCreateList} from "./AdapterComponentCreateList";
import AdapterComponentEdit from "../component-edit/AdapterComponentEdit";
import {AdapterDataContext} from "../../context/AdapterDataContext";
import {AdapterComponentContext} from "../../reducers/component/AdapterComponentReducer";

const useComponentCreate = (props) => {
    const [renderTypeEdit, setRenderTypeEdit] = useState<boolean>(false);
    const {data, save} = useContext(AdapterDataContext);
    const {state, dispatch} = useContext(AdapterComponentContext);
    // @ts-ignore
    const {selectedComponent, errors = {}, hasValidated} = state;
    const {
        page, toggleAddComponent = () => {
        }
    } = props;

    const [isSaving, setIsSaving] = useState(false);
    const hasErrors = hasValidationErrors(errors);

    useEffect(() => {
        // render in the next re-paint to allow the DOM to reflow without the list
        // thus resetting the Flyout wrapper scrolling position
        // This is a quick work around the bug in small screens
        // where once user scrolls down the components list and selects one of the bottom components
        // then the component edit screen renders already scrolled to the bottom
        let isMounted = true;

        if (selectedComponent?.type) {
            window.requestAnimationFrame(() => {
                if (isMounted) setRenderTypeEdit(true);
            });
        } else {
            setRenderTypeEdit(false);
        }

        return () => {
            isMounted = false;
        };
    }, [selectedComponent?.type]);

    useEffect(() => {
        dispatch({type: Actions.SET_PAGE, payload: page.path});
    }, [page.path]);

    useLayoutEffect(() => {
        if (hasValidated && !hasErrors) {
            handleSubmit()
                .then()
                .catch((err) => {
                    logger.error("ComponentCreate", err);
                });
        }
    }, [hasValidated, hasErrors]);

    const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();

        if (!hasValidated) {
            dispatch({type: Actions.VALIDATE});
            return;
        }

        if (hasErrors) {
            return;
        }

        setIsSaving(true);
        const {selectedComponent} = state;
        // @ts-ignore
        const updatedData = addComponent(data, (page as AdapterPage).path, selectedComponent);

        await save(updatedData);
        toggleAddComponent();
    };

    const handleTypeChange = (component: AdapterComponentDef) => {
        dispatch({
            type: Actions.EDIT_TYPE,
            payload: {
                type: component.type,
            },
        });
    };

    const reset = (e) => {
        e.preventDefault();
        dispatch({type: Actions.SET_COMPONENT});
    };

    return {
        handleSubmit,
        handleTypeChange,
        hasErrors,
        errors: Object.values(errors),
        component: selectedComponent,
        isSaving,
        reset,
        renderTypeEdit,
    };
}

export const AdapterComponentCreate = (props) => {
    const {
        handleSubmit,
        handleTypeChange,
        reset,
        //@ts-ignore
        hasErrors,
        //@ts-ignore
        errors,
        component,
        //@ts-ignore
        isSaving,
        renderTypeEdit,
        //@ts-ignore
        page
    } = useComponentCreate(props);

    const type = component?.type;

    return (
        <div className="component-create" data-testid={"component-create"}>
            {!type && <h4 className="govuk-heading-m">{i18n("component.create")}</h4>}
            {type && (
                <>
                    <BackLink onClick={reset}>
                        {i18n("Back to create component list")}
                    </BackLink>
                    <h4 className="govuk-heading-m">
                        {i18n(`fieldTypeToName.${component?.["type"]}`)}{" "}
                        {i18n("component.component")}
                    </h4>
                </>
            )}
            {!type && <AdapterComponentCreateList onSelectComponent={handleTypeChange}/>}
            {type && renderTypeEdit && (
                <form onSubmit={handleSubmit}>
                    {type && <AdapterComponentEdit page={props.page}/>}
                </form>
            )}
        </div>
    );
}

export default AdapterComponentCreate;
