import {
    InitialiseSessionOptions
} from "../../../../../digital-form-builder/runner/src/server/plugins/initialiseSession/types";


export type AdapterInitialiseSessionOptions = InitialiseSessionOptions & {
    returnUrl?: string;
};
