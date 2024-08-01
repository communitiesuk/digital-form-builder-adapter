
import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {redirectUrl} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";


export const proceed = (request: HapiRequest, h: HapiResponseToolkit, nextUrl: string) => {
    const returnUrl = request.query.returnUrl;
    let form_session_identifier = "";

    if (request.query.form_session_identifier) {
        form_session_identifier = `?form_session_identifier=${request.query.form_session_identifier}`;
    }

    if (typeof returnUrl === "string" && returnUrl.startsWith("/")) {
        return h.redirect(`${returnUrl}${form_session_identifier}`);
    } else {
        return redirectTo(request, h, nextUrl);
    }
}


export const redirectTo = (request: HapiRequest, h: HapiResponseToolkit, targetUrl: string, params = {}) => {
    if (targetUrl.startsWith("http")) {
        return h.redirect(targetUrl);
    }
    if (request.query.form_session_identifier) {
        // @ts-ignore
        params.form_session_identifier = request.query.form_session_identifier;
    }
    const url = redirectUrl(request, targetUrl, params);
    return h.redirect(url);
}



