import Wreck from "@hapi/wreck";
import config from "../../config";

export const publish = async function (id, configuration, request): Promise<any> {
  try {
    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };

    const userToken = request?.state?.[config.authCookieName];
    if (userToken) {
      headers["Cookie"] = `${config.authCookieName}=${userToken}`;
    }

    return Wreck.post(`${config.publishUrl}/publish`, {
      payload: JSON.stringify({ id, configuration }),
      headers,
    });
  } catch (error) {
    throw new Error(
      `Error when publishing to endpoint ${config.publishUrl}/publish: message: ${error.message}`
    );
  }
};
