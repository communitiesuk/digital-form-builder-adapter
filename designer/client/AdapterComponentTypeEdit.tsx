import React, {useContext} from "react";
import {ComponentTypes} from "@xgovformbuilder/model";
import {TextFieldEdit} from "../../digital-form-builder/designer/client/components/FieldEditors/text-field-edit";
import {MultilineTextFieldEdit} from "../../digital-form-builder/designer/client/multiline-text-field-edit";
import {NumberFieldEdit} from "../../digital-form-builder/designer/client/components/FieldEditors/number-field-edit";
import ListFieldEdit from "../../digital-form-builder/designer/client/components/FieldEditors/list-field-edit";
import SelectFieldEdit from "../../digital-form-builder/designer/client/components/FieldEditors/select-field-edit";
import DetailsEdit from "../../digital-form-builder/designer/client/components/FieldEditors/details-edit";
import {ParaEdit} from "../../digital-form-builder/designer/client/components/FieldEditors/para-edit";
import {FileUploadFieldEdit} from "../../digital-form-builder/designer/client/file-upload-field-edit";
import {DateFieldEdit} from "../../digital-form-builder/designer/client/components/FieldEditors/date-field-edit";
import {ComponentContext} from "../../digital-form-builder/designer/client/reducers/component/componentReducer";
import FieldEdit from "../../digital-form-builder/designer/client/field-edit";
import {FreeTextFieldEdit} from "./FreeTextFieldEdit";

export const componentTypeEditors: any = {
    TextField: TextFieldEdit,
    EmailAddressField: TextFieldEdit,
    TelephoneNumberField: TextFieldEdit,
    MultilineTextField: MultilineTextFieldEdit,
    NumberField: NumberFieldEdit,
    AutocompleteField: ListFieldEdit,
    SelectField: SelectFieldEdit,
    RadiosField: ListFieldEdit,
    CheckboxesField: ListFieldEdit,
    FlashCard: ListFieldEdit,
    List: ListFieldEdit,
    Details: DetailsEdit,
    Para: ParaEdit,
    Html: ParaEdit,
    InsetText: ParaEdit,
    WarningText: ParaEdit,
    FileUploadField: FileUploadFieldEdit,
    DatePartsField: DateFieldEdit,
    DateTimeField: DateFieldEdit,
    DateTimePartsField: DateFieldEdit,
    DateField: DateFieldEdit,
    FreeTextField: FreeTextFieldEdit,
};

export const AdapterComponentTypeEdit = (props) => {
    const {context = ComponentContext, page} = props;
    // @ts-ignore
    const {state} = useContext(context);
    const {selectedComponent} = state;
    const type = ComponentTypes.find(
        (t) => t.name === selectedComponent?.type ?? ""
    );

    const needsFieldInputs =
        type?.subType !== "content" || ["FlashCard", "List"].includes(type?.name);

    const TagName = componentTypeEditors[type?.name ?? ""];
    return (
        <div>
            {needsFieldInputs && (
                <FieldEdit
                    isContentField={type?.subType === "content"}
                    isListField={type?.subType === "listField"}
                />
            )}
            {TagName && <TagName page={page}/>}
        </div>
    );
}