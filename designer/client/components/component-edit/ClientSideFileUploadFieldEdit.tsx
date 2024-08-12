import {AdapterComponentContext} from "../../reducers/component/AdapterComponentReducer";
import React, {useContext} from "react";
import {Actions} from "../../../../digital-form-builder/designer/client/reducers/component/types";
import {i18n} from "../../../../digital-form-builder/designer/client/i18n";


export const ClientSideFileUploadFieldEdit: any = ({context = AdapterComponentContext}) => {
    const {state, dispatch} = useContext(context);
    const {selectedComponent} = state;
    const {options = {}} = selectedComponent;

    return (
        <div className="govuk-form-group">
            <label
                className="govuk-label govuk-label--s"
                htmlFor="field-schema-maxwords"
            >
                {i18n("textFieldEditComponent.maxWordField.title")}
            </label>
            <span className="govuk-hint">
        {i18n("textFieldEditComponent.maxWordField.helpText")}
      </span>
            <input
                className="govuk-input govuk-input--width-3"
                data-cast="number"
                id="field-schema-maxwords"
                name="schema.maxwords"
                value={options.maxWords || ""}
                type="number"
                onChange={(e) =>
                    dispatch({
                        type: Actions.EDIT_OPTIONS_MAX_WORDS,
                        payload: e.target.value,
                    })
                }
            />
        </div>
    );
}
