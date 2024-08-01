import AuthCookie from "@hapi/cookie";
import Bell from "@hapi/bell";

import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../types";
import {redirectTo} from "../../../../../digital-form-builder/runner/src/server/plugins/engine";
import generateCookiePassword from "../../../../../digital-form-builder/runner/src/server/utils/generateCookiePassword";
import {config} from "../utils/AdapterConfigurationSchema";
import JwtPlugin from "hapi-auth-jwt2"

export const jwtAuthStrategyName = "jwt_auth";

export const shouldLogin = (request: HapiRequest) => (config.authEnabled && !request.auth.isAuthenticated);

export const oauth2ConfigRegister = async (server: HapiServer) => {
    if (!config.authEnabled) {
        await server.register(AuthCookie);
        await server.register(Bell);

        server.auth.strategy("session", "cookie", {
            cookie: {
                name: "auth",
                password: config.sessionCookiePassword || generateCookiePassword(),
                isSecure: true,
            },
        });

        server.auth.strategy("oauth", "bell", {
            provider: {
                name: "oauth",
                protocol: "oauth2",
                auth: config.authClientAuthUrl,
                token: config.authClientTokenUrl,
                scope: ["read write"],
                profile: async (credentials, _params, get) => {
                    const {email, first_name, last_name, user_id} = await get(
                        config.authClientProfileUrl
                    );
                    credentials.profile = {email, first_name, last_name, user_id};
                },
            },
            password: config.sessionCookiePassword || generateCookiePassword(),
            clientId: config.authClientId,
            clientSecret: config.authClientSecret,
            forceHttps: config.serviceUrl.startsWith("https"),
        });

        server.auth.default({strategy: "session", mode: "try"});

        server.route({
            method: ["GET", "POST"],
            path: "/login",
            config: {
                auth: "oauth",
                handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                    console.log(`**************** Auth Login ${request.auth.isAuthenticated}`)
                    if (request.auth.isAuthenticated) {
                        //@ts-ignore
                        request.cookieAuth.set(request.auth.credentials.profile);
                        //@ts-ignore
                        const returnUrl = request.auth.credentials.query?.returnUrl || "/";
                        return redirectTo(request, h, returnUrl);
                    }
                    return h.response(JSON.stringify(request));
                },
            },
        });

        server.route({
            method: "get",
            path: "/logout",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                //@ts-ignore
                request.cookieAuth.clear();
                request.yar.reset();

                return redirectTo(request, h, "/");
            },
        });
    }
}

// rsa256Options()
// Returns configuration options for rsa256 auth strategy
export function rsa256Options(jwtAuthCookieName) {
    return {
        key: keyFunc,
        validate,
        verifyOptions: {
            algorithms: ["RS256"],
        },
        urlKey: false,
        cookieKey: jwtAuthCookieName,
    };
}

 // keyFunc returns the key and any additonal context required to
// passed to validate function (below) to validate signature
// this is normally used to look up keys from list in a multi-tenant scenario
const keyFunc = async function (decoded) {
    const key = Buffer.from(config.rsa256PublicKeyBase64 ?? "", "base64");
    return {key, additional: decoded};
};

// validate()
// Checks validity of user credentials
// @ts-ignore
const validate = async function (decoded, request, h) {
    // This runs if the jwt signature is verified
    // It must return an object with an 'isValid' boolean property,
    // this allows the user to continue if true or raises a 401 if false
    const credentials = decoded;
    if (request.plugins["hapi-auth-jwt2"]) {
        credentials.extraInfo = request.plugins["hapi-auth-jwt2"].extraInfo;
    }
    if (!decoded.accountId) {
        request.logger.error(
            "JWT token has no accountID in jwt: " + credentials.extraInfo.toString()
        );
        return {isValid: false};
    } else {
        return {isValid: true, credentials};
    }
};

export default {
    plugin: {
        name: "auth",
        register: async (server: HapiServer) => {
            if (config.authEnabled) {
                console.log(`Oauth2 Authentication Enabled: ${config.authEnabled}`);
                await oauth2ConfigRegister(server);
            } else if (config.jwtAuthEnabled) {
                await server.register(JwtPlugin);
                console.log(`JWT Authentication Enabled: ${config.jwtAuthEnabled}`);
                console.log(`JWT Authentication cookie name: ${config.jwtAuthCookieName}`);
                console.log(`JWT Authentication sign out url: ${config.jwtRedirectToAuthenticationUrl}`);
                console.log(`JWT Authentication strategy name: ${jwtAuthStrategyName}`);
                server.auth.strategy(jwtAuthStrategyName, "jwt", rsa256Options(config.jwtAuthCookieName));
            } else {
                return;
            }
        },
    },
};
