import {createContext} from "react";
import {AdapterFormDefinition} from "@communitiesuk/model";

export const AdapterDataContext = createContext<{
    data: AdapterFormDefinition;
    save: (toUpdate: AdapterFormDefinition, displayName?: string) => Promise<false>;
    displayName?: string;
}>({
    data: {} as AdapterFormDefinition,
    save: async (_data: AdapterFormDefinition) => false,
});
