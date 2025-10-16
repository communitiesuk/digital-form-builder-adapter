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
                            // ============ COMPREHENSIVE AUTH ERROR LOGGING ============
                            console.error("\n========== 401/403 AUTH ERROR ==========");
                            console.error("Timestamp:", new Date().toISOString());
                            console.error("Status Code:", statusCode);
                            console.error("Path:", request.path);
                            console.error("Method:", request.method.toUpperCase());
                            console.error("Error message:", response.message);
                            
                            // Log error details
                            if (response.output.payload) {
                                console.error("Error payload:", JSON.stringify(response.output.payload, null, 2));
                            }
                            
                            // Log auth state
                            console.error("Auth state:", JSON.stringify({
                                isAuthenticated: request.auth.isAuthenticated,
                                error: request.auth.error?.message || null,
                                strategy: request.auth.strategy || null,
                                mode: request.auth.mode || null,
                            }, null, 2));
                            
                            // Log credentials if available
                            if (request.auth.credentials) {
                                console.error("Auth credentials present:", Object.keys(request.auth.credentials));
                                console.error("Auth credentials:", JSON.stringify(request.auth.credentials, null, 2));
                            } else {
                                console.error("⚠️ NO AUTH CREDENTIALS");
                            }
                            
                            // Log headers
                            console.error("Request headers:", JSON.stringify({
                                "content-type": request.headers["content-type"] || "none",
                                "cookie": request.headers["cookie"] ? "present" : "MISSING",
                                "authorization": request.headers["authorization"] ? "present" : "none",
                                "user-agent": request.headers["user-agent"] || "none",
                            }, null, 2));
                            
                            // Parse and log cookies if present
                            if (request.headers.cookie) {
                                console.error("Raw Cookie header:", request.headers.cookie);
                                const cookies = request.headers.cookie.split(';').map(c => c.trim());
                                console.error("All cookies:", cookies);
                                
                                // Check for JWT cookie specifically
                                const jwtCookie = cookies.find(c => c.startsWith(`${config.jwtAuthCookieName}=`));
                                if (jwtCookie) {
                                    const tokenValue = jwtCookie.split('=')[1];
                                    console.error(`✓ JWT cookie (${config.jwtAuthCookieName}) present`);
                                    console.error(`  Token length: ${tokenValue.length}`);
                                    console.error(`  Token preview: ${tokenValue.substring(0, 30)}...`);
                                } else {
                                    console.error(`✗ JWT cookie (${config.jwtAuthCookieName}) MISSING`);
                                    console.error(`  Expected cookie name: ${config.jwtAuthCookieName}`);
                                }
                            } else {
                                console.error("⚠️ NO COOKIES IN REQUEST");
                            }
                            
                            // Log JWT config
                            console.error("JWT Config:", JSON.stringify({
                                jwtAuthEnabled: config.jwtAuthEnabled,
                                jwtAuthCookieName: config.jwtAuthCookieName,
                                jwtRedirectUrl: config.jwtRedirectToAuthenticationUrl,
                                rsa256KeyConfigured: !!config.rsa256PublicKeyBase64,
                                rsa256KeyLength: config.rsa256PublicKeyBase64?.length || 0,
                            }, null, 2));
                            
                            // If we have auth artifacts from hapi-auth-jwt2
                            if (request.plugins && request.plugins["hapi-auth-jwt2"]) {
                                console.error("JWT Plugin artifacts:", JSON.stringify(request.plugins["hapi-auth-jwt2"], null, 2));
                            }
                            
                            // Log full error stack
                            if (response.stack) {
                                console.error("Error stack:", response.stack);
                            }
                            
                            console.error("Redirecting to:", config.jwtRedirectToAuthenticationUrl + "?referrer=" + request.url);
                            console.error("========== END 401/403 ERROR ==========\n");
                            // ============ END COMPREHENSIVE AUTH ERROR LOGGING ============
                            
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