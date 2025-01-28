import joi from "joi";
import {configSchema} from "../../../../../digital-form-builder/runner/src/server/utils/configSchema";
import {default as nodeConfig} from "config";


export const ExtendedAdapterSchema: any = joi.object({
    jwtAuthEnabled: joi.boolean().optional(),
    jwtAuthCookieName: joi.string().when("jwtAuthEnabled", {
        then: joi.required(),
        otherwise: joi.optional(),
    }),
    jwtRedirectToAuthenticationUrl: joi.string().when("jwtAuthEnabled", {
        then: joi.required(),
        otherwise: joi.optional(),
    }),
    eligibilityResultUrl: joi.string().optional().allow(""),
});

export const AdapterConfigurationSchema: any = configSchema.concat(ExtendedAdapterSchema)


export function buildConfig(config) {
  // Validate config
  const result = AdapterConfigurationSchema.validate(config, {
    abortEarly: false,
    convert: true,
    allowUnknown: true,
  });

  console.log('PASSWORD HERE:', config.sessionCookiePassword)

  // Throw if config is invalid
  if (result.error) {
    throw new Error(`The server config is invalid. ${result.error.message}`);
  }

  return config;
}

export const config = buildConfig(nodeConfig);
