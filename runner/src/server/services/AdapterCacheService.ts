import {CacheService} from "../../../../digital-form-builder/runner/src/server/services";
import Jwt from "@hapi/jwt";
import {
    DecodedSessionToken
} from "../../../../digital-form-builder/runner/src/server/plugins/initialiseSession/types";
import {config} from "../plugins/utils/AdapterConfigurationSchema";
import CatboxRedis from "@hapi/catbox-redis";
import CatboxMemory from "@hapi/catbox-memory";

import Redis from "ioredis";
import {HapiRequest} from "../types";

const partition = "cache";

const {
    redisHost,
    redisPort,
    redisPassword,
    redisTls,
    isSingleRedis,
    sessionTimeout,
} = config;
let redisUri;

if (process.env.FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI) {
    redisUri = process.env.FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI;
}

enum ADDITIONAL_IDENTIFIER {
    Confirmation = ":confirmation",
}

export class AdapterCacheService extends CacheService {

    async activateSession(jwt, request) {
        request.logger.info(`[ACTIVATE-SESSION] jwt ${jwt}`);
        const initialisedSession = await this.cache.get(this.JWTKey(jwt));
        request.logger.info(`[ACTIVATE-SESSION] session details ${initialisedSession}`);
        const {decoded} = Jwt.token.decode(jwt);
        const {payload}: { payload: DecodedSessionToken } = decoded;
        const userSessionKey = {segment: partition, id: `${request.yar.id}:${payload.group}`};
        request.logger.info(`[ACTIVATE-SESSION] session metadata ${userSessionKey}`);
        const {redirectPath} = await super.activateSession(jwt, request);

        let redirectPathNew = redirectPath
        const form_session_identifier = initialisedSession.metadata?.form_session_identifier;
        if (form_session_identifier) {
            userSessionKey.id = `${userSessionKey.id}:${form_session_identifier}`;
            redirectPathNew = `${redirectPathNew}?form_session_identifier=${form_session_identifier}`;
        }

        if (config.overwriteInitialisedSession) {
            request.logger.info("[ACTIVATE-SESSION] Replacing user session with initialisedSession");
            this.cache.set(userSessionKey, initialisedSession, sessionTimeout);
        } else {
            const currentSession = await this.cache.get(userSessionKey);
            const mergedSession = {
                ...currentSession,
                ...initialisedSession,
            };
            request.logger.info("[ACTIVATE-SESSION] Merging user session with initialisedSession");
            this.cache.set(userSessionKey, mergedSession, sessionTimeout);
        }
        request.logger.info(`[ACTIVATE-SESSION] redirect ${redirectPathNew}`);
        const key = this.JWTKey(jwt);
        request.logger.info(`[ACTIVATE-SESSION] drop key ${JSON.stringify(key)}`);
        await this.cache.drop(key);
        return {
            redirectPath: redirectPathNew,
        };
    }

    /**
     * The key used to store user session data against.
     * If there are multiple forms on the same runner instance, for example `form-a` and `form-a-feedback` this will prevent CacheService from clearing data from `form-a` if a user gave feedback before they finished `form-a`
     *
     * @param request - hapi request object
     * @param additionalIdentifier - appended to the id
     */
    //@ts-ignore
    Key(request: HapiRequest, additionalIdentifier?: ADDITIONAL_IDENTIFIER) {
        let id = `${request.yar.id}:${request.params.id}`;

        if (request.query.form_session_identifier) {
            id = `${id}:${request.query.form_session_identifier}`;
        }
        request.logger.info(`[ACTIVATE-SESSION] session key ${id} and segment is ${partition}`);
        return {
            segment: partition,
            id: `${id}${additionalIdentifier ?? ""}`,
        };
    }
}

export const catboxProvider = () => {
    /**
     * If redisHost doesn't exist, CatboxMemory will be used instead.
     * More information at {@link https://hapi.dev/module/catbox/api}
     */
    const provider = {
        constructor: redisHost || redisUri ? CatboxRedis.Engine : CatboxMemory.Engine,
        options: {},
    };

    if (redisHost || redisUri) {
        console.log("Starting redis session management")
        const redisOptions: {
            password?: string;
            tls?: {};
        } = {};

        if (redisPassword) {
            redisOptions.password = redisPassword;
        }

        if (redisTls) {
            redisOptions.tls = {};
        }

        const client = isSingleRedis
            ? new Redis(
                redisUri ?? {
                    host: redisHost,
                    port: redisPort,
                    password: redisPassword,
                }
            )
            : new Redis.Cluster(
                [
                    {
                        host: redisHost,
                        port: redisPort,
                    },
                ],
                {
                    dnsLookup: (address, callback) => callback(null, address, 4),
                    redisOptions,
                }
            );
        provider.options = {client, partition};
        console.log(`Redis Url : ${redisUri} session management`);
        client.ping((error, result) => {
            if (error) {
                console.log(`Redis not connected ${error}`);
            } else {
                console.log(`Redis connected ${result}`);
            }
        })
    } else {
        console.log("Starting in memory session management")
        provider.options = {partition};
    }

    return provider;
};
