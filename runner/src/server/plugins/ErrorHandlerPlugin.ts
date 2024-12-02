import {HapiRequest, HapiResponseToolkit} from "../types";
import {config} from "./utils/AdapterConfigurationSchema";

/*
 * Add an `onPreResponse` listener to return error pages
 */
export default {
    plugin: {
        name: "error-pages",
        register: (server) => {
            server.ext(
                "onPreResponse",
                (request: HapiRequest, h: HapiResponseToolkit) => {
                    const response = request.response;

                    if (config.jwtAuthCookieName && request.state) {
                        const authCookie = request.state[config.jwtAuthCookieName];
                        const authHeader = request.headers.authorization;
                        request.logger.info(`[AUTH] Path: ${request.path} | Auth Cookie: ${authCookie ? 'Present' : 'Missing'} | Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
                    }

                    if ("isBoom" in response && response.isBoom) {
                        // An error was raised during
                        // processing the request
                        const statusCode = response.output.statusCode;
                        const errorMessage = `${response.message}\n${response.stack || ""}`;

                        // In the event of 404
                        // return the `404` view
                        if (statusCode === 404) {
                            return h.view("404").code(statusCode);
                        }

                        // In the event of 401
                        // redirect to authentication url
                        if (statusCode === 401 || statusCode === 403) {
                            console.log(`Getting an authentication error code: ${statusCode} and message: ${errorMessage}`);
                            return h.redirect(
                                config.jwtRedirectToAuthenticationUrl +
                                "?referrer=" +
                                request.url
                            );
                        }
                        request.logger.error(errorMessage);
                        request.log("error", {
                            statusCode: statusCode,
                            data: response.data,
                            message: response.message,
                        });

                        // The return the `500` view
                        return h.view("500").code(statusCode);
                    }
                    return h.continue;
                }
            );
        },
    },
};
