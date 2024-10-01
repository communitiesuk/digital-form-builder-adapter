import {format} from "date-fns";
import nunjucks from "nunjucks";
import {AdapterFormModel} from "./AdapterFormModel";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {config} from "../../utils/AdapterConfigurationSchema";
import {FeesModel} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission";
import {AdapterFormComponent} from "../components";
import {
    SelectionControlField
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/SelectionControlField";
import {Field} from "../../../../../../digital-form-builder/runner/src/server/schemas/types";
import {PageControllerBase} from "../page-controllers/PageControllerBase";

export function WebhookModel(model: AdapterFormModel, state: FormSubmissionState) {
    let englishName = `${config.serviceName} ${model.basePath}`;

    if (model.name) {
        englishName = model.name.en ?? model.name;
    }

    let questions;

    //Getting pages based on the answers in the state & this will allow the user to save all the given answers in the db
    //TODO probable redesign will happen with https://dluhcdigital.atlassian.net/browse/FS-4341 Jira this tries to manage application state based on scenarios
    const {relevantPages} = model.getRelevantPagesBasedOnState(state);

    questions = relevantPages.map((page) => pagesToQuestions(page, state));
    const fees = FeesModel(model, state);
    console.log(`[WebhookModel] save data ${JSON.stringify(questions)}`);

    return {
        metadata: model.def.metadata,
        name: englishName,
        questions: questions,
        ...(!!fees && {fees}),
    };
}

function createToFieldsMap(state: FormSubmissionState) {
    return function (component: AdapterFormComponent | SelectionControlField): Field {
        // @ts-ignore - This block of code should not be hit since childrenCollection no
        if (component.items?.childrenCollection?.formItems) {
            const toField = createToFieldsMap(state);

            /**
             * This is currently deprecated whilst GDS fix a known issue with accessibility and conditionally revealed fields
             */
                // @ts-ignore
            const nestedComponent = component?.items?.childrenCollection.formItems;
            const nestedFields = nestedComponent?.map(toField);

            return nestedFields;
        }
        return {
            //@ts-ignore
            key: component.name,
            //@ts-ignore
            title: component.title,
            //@ts-ignore
            type: component.dataType,
            //@ts-ignore
            answer: fieldAnswerFromComponent(component, state),
        };
    };
}

function pagesToQuestions(
    page: PageControllerBase,
    state: FormSubmissionState,
    index = 0
) {
    // TODO - index should come from the current iteration of the section.

    let sectionState = state;
    if (page.section) {
        sectionState = state[page.section.name];
    }

    const toFields = createToFieldsMap(sectionState);
    const components = page.components.formItems;

    //@ts-ignore
    const pageTitle = nunjucks.renderString(page.title.en ?? page.title, {
        ...state,
    });

    return {
        category: page.section?.name,
        question: pageTitle,
        fields: components.flatMap(toFields),
        index,
    };
}

function fieldAnswerFromComponent(
    component: AdapterFormComponent,
    state: FormSubmissionState = {}
) {
    if (!component) {
        return;
    }
    const rawValue = state?.[component.name];

    switch (component.dataType) {
        case "list":
            return rawValue;
        //@ts-ignore
        case "multiInput":
            return rawValue;
        case "date":
            if (rawValue) {
                return format(new Date(rawValue), "yyyy-MM-dd");
            }
            return undefined;
        case "monthYear":
            if (rawValue) {
                const [month, year] = Object.values(rawValue);
                return format(new Date(`${year}-${month}-1`), "yyyy-MM");
            }
            return undefined;
        default:
            return component.getDisplayStringFromState(state);
    }
}
