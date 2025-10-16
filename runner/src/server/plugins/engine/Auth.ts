import {HapiServer} from "../../types";
import {config} from "../utils/AdapterConfigurationSchema";
import JwtPlugin from "hapi-auth-jwt2"

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

// keyFunc returns the key and any additonal context required to
// passed to validate function (below) to validate signature
// this is normally used to look up keys from list in a multi-tenant scenario
const keyFunc = async function (decoded) {
    // ============ DIAGNOSTIC LOGGING ============
    console.log("========== JWT KEY FUNC ==========");
    console.log("Decoded JWT header:", decoded.header);
    console.log("Decoded JWT payload:", JSON.stringify(decoded.payload, null, 2));
    console.log("RSA key present:", !!config.rsa256PublicKeyBase64);
    console.log("RSA key length:", config.rsa256PublicKeyBase64?.length || 0);
    // ============ DIAGNOSTIC LOGGING END ============
    
    const key = Buffer.from(config.rsa256PublicKeyBase64 ?? "", "base64");
    return {key, additional: decoded};
};

// validate()
// Checks validity of user credentials
// @ts-ignore
const validate = async function (decoded, request, h) {
    // ============ DIAGNOSTIC LOGGING ============
    console.log("========== JWT VALIDATE FUNC ==========");
    console.log("Decoded JWT:", JSON.stringify(decoded, null, 2));
    console.log("Request path:", request.path);
    console.log("Request method:", request.method);
    console.log("Request headers (cookies):", request.headers.cookie);
    // ============ DIAGNOSTIC LOGGING END ============
    
    // This runs if the jwt signature is verified
    // It must return an object with an 'isValid' boolean property,
    // this allows the user to continue if true or raises a 401 if false
    const credentials = decoded;
    if (request.plugins["hapi-auth-jwt2"]) {
        credentials.extraInfo = request.plugins["hapi-auth-jwt2"].extraInfo;
    }
    if (!decoded.accountId) {
        // ============ DIAGNOSTIC LOGGING ============
        console.error("❌ JWT VALIDATION FAILED: No accountId");
        console.error("Available keys in decoded:", Object.keys(decoded));
        // ============ DIAGNOSTIC LOGGING END ============
        
        request.logger.error(
            "JWT token has no accountID in jwt: " + credentials.extraInfo?.toString()
        );
        return {isValid: false};
    } else {
        // ============ DIAGNOSTIC LOGGING ============
        console.log("✅ JWT VALIDATION SUCCESS");
        console.log("AccountId:", decoded.accountId);
        console.log("========== END JWT VALIDATE ==========\n");
        // ============ DIAGNOSTIC LOGGING END ============
        return {isValid: true, credentials};
    }
};

export default {
    plugin: {
        name: "auth",
        register: async (server: HapiServer) => {
            if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
                await server.register(JwtPlugin);
                console.log("========== JWT AUTH PLUGIN REGISTERED ==========");
                console.log(`JWT Authentication Enabled: ${config.jwtAuthEnabled}`);
                console.log(`JWT Authentication cookie name: ${config.jwtAuthCookieName}`);
                console.log(`JWT Authentication sign out url: ${config.jwtRedirectToAuthenticationUrl}`);
                console.log(`JWT Authentication strategy name: ${jwtAuthStrategyName}`);
                console.log(`RSA key configured: ${!!config.rsa256PublicKeyBase64}`);
                console.log("========== END JWT AUTH SETUP ==========\n");
                
                server.auth.strategy(jwtAuthStrategyName, "jwt", rsa256Options(config.jwtAuthCookieName));
            } else {
                console.log("JWT Authentication DISABLED");
                return;
            }
        },
    },
};