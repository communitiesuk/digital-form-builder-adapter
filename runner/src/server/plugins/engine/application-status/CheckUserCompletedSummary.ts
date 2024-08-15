import {HapiRequest, HapiResponseToolkit} from "../../../types";


export async function checkUserCompletedSummary(request: HapiRequest, h: HapiResponseToolkit) {
    const {adapterCacheService} = request.services([]);
    //@ts-ignore
    const state = await adapterCacheService.getState(request);

    if (state?.userCompletedSummary !== true) {
        request.logger.error(
            [`/${request.params.id}/status`],
            `${request.yar.id} user has incomplete state, redirecting to /summary`
        );
        let form_session_identifier = "";
        if (request.query.form_session_identifier) {
            form_session_identifier = `?form_session_identifier=${request.query.form_session_identifier}`;
        }
        return h.redirect(`/${request.params.id}/summary${form_session_identifier}`).takeover();
    }
    return state.userCompletedSummary;
}
