
import JwtPlugin from "hapi-auth-jwt2"
import {HapiServer} from "../../../digital-form-builder/designer/server/types";
import config from "../config";

export const jwtAuthStrategyName = "jwt_auth";

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

// keyFunc returns the key and any additional context required to
// pass to validate the function (below) to validate signature
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
            // @ts-ignore
            if (config.authEnabled && config.authEnabled === "true") {
                // @ts-ignore
                await server.register(JwtPlugin);
                console.log(`JWT Authentication Enabled: ${config.authEnabled}`);
                console.log(`JWT Authentication cookie name: ${config.rsa256PublicKeyBase64}`);
                console.log(`JWT Authentication strategy name: ${jwtAuthStrategyName}`);
                server.auth.strategy(jwtAuthStrategyName, "jwt", rsa256Options(config.authCookieName));
            } else {
                return;
            }
        },
    },
};
