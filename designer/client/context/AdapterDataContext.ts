import {createContext} from "react";
import {AdapterFormDefinition} from "@communitiesuk/model";

export const AdapterDataContext = createContext<{
    data: AdapterFormDefinition;
    save: (toUpdate: AdapterFormDefinition) => Promise<false>;
}>({
    data: {} as AdapterFormDefinition,
    save: async (_data: AdapterFormDefinition) => false,
});
