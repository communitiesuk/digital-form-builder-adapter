import React, {useReducer, createContext} from "react";
import {AdapterComponentDef} from "@communitiesuk/model";
import {
    Actions, ComponentActions, Meta
} from "../../../../digital-form-builder/designer/client/reducers/component/types";
import {
    ComponentContext,
    getSubReducer,
    initComponentState
} from "../../../../digital-form-builder/designer/client/reducers/component/componentReducer";

type AdapterComponentState = {
    selectedComponent: Partial<AdapterComponentDef>;
    isNew?: boolean;
    initialName?: AdapterComponentDef["name"];
    pagePath?: string;
    listItemErrors?: {};
};

const defaultValues = {
    selectedComponent: {},
};
/**
 * Context providing the {@link AdapterComponentState} and {@link dispatch} for changing any values specified by {@link Actions}
 */
export const AdapterComponentContext = createContext<{
    state: AdapterComponentState; dispatch: React.Dispatch<any>;
}>({
    state: defaultValues,
    dispatch: () => {
    },
});

const isNotValidate = (type): type is Meta.VALIDATE => {
    return Object.values(Actions).includes(type);
};

export function adapterComponentReducer(
    state,
    action: {
        type: ComponentActions;
        payload: any;
    }
) {
    const {type} = action;
    const {selectedComponent} = state;

    if (isNotValidate(type)) {
        state.hasValidated = false;
    }

    const subReducer: any = getSubReducer(type);

    if (subReducer) {
        return {
            ...state,
            ...subReducer(state, action),
        };
    } else {
        //@ts-ignore
        console.log("Unrecognised action:", action.type);
        return {...state, selectedComponent};
    }
}

/**
 * Allows components to retrieve {@link AdapterComponentState} and {@link dispatch} from any component nested within `<ComponentContextProvider>`
 */
export const AdapterComponentContextProvider = (props) => {
    const {children, ...rest} = props;
    const [state, dispatch] = useReducer(adapterComponentReducer, initComponentState(rest));

    return (
        <AdapterComponentContext.Provider value={{state, dispatch}}>
            <ComponentContext.Provider value={{state, dispatch}}>
                {children}
            </ComponentContext.Provider>
        </AdapterComponentContext.Provider>
    );
};
