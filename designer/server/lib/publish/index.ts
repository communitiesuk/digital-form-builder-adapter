import Wreck from "@hapi/wreck";
import config from "../../config";

export const publish = async function (id, configuration, request): Promise<any> {
  try {
    // ============ DIAGNOSTIC LOGGING START ============
    console.log("========== PUBLISH FUNCTION DEBUG ==========");
    console.log(`Publishing form: ${id}`);
    console.log(`Config authCookieName: ${config.authCookieName}`);
    console.log(`Config publishUrl: ${config.publishUrl}`);
    
    // Log ALL incoming cookies
    console.log("All incoming cookies:", JSON.stringify(request.state, null, 2));
    
    // Check for the specific JWT cookie
    const userToken = request?.state?.[config.authCookieName];
    console.log(`JWT cookie present: ${!!userToken}`);
    
    if (userToken) {
      console.log(`JWT token length: ${userToken.length}`);
      console.log(`JWT token first 30 chars: ${userToken.substring(0, 30)}...`);
      console.log(`JWT token last 30 chars: ...${userToken.substring(userToken.length - 30)}`);
      
      // Try to decode the JWT to see what's in it (don't verify, just decode)
      try {
        const [header, payload, signature] = userToken.split('.');
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
        console.log("Decoded JWT payload:", JSON.stringify(decodedPayload, null, 2));
        console.log(`JWT expiry: ${new Date(decodedPayload.exp * 1000).toISOString()}`);
        console.log(`JWT issued at: ${new Date(decodedPayload.iat * 1000).toISOString()}`);
      } catch (e) {
        console.log("Could not decode JWT:", e.message);
      }
    } else {
      console.warn("⚠️ NO JWT TOKEN FOUND IN REQUEST!");
    }

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };

    if (userToken) {
      headers["Cookie"] = `${config.authCookieName}=${userToken}`;
      console.log(`Setting Cookie header: ${config.authCookieName}=<token>`);
    }

    console.log("Request headers (excluding token):", {
      "Content-Type": headers["Content-Type"],
      "Cookie": headers["Cookie"] ? `${config.authCookieName}=<present>` : "none"
    });
    console.log("========== MAKING REQUEST TO RUNNER ==========");
    // ============ DIAGNOSTIC LOGGING END ============

    const response = await Wreck.post(`${config.publishUrl}/publish`, {
      payload: JSON.stringify({ id, configuration }),
      headers,
    });

    // ============ SUCCESS LOGGING ============
    console.log("✅ PUBLISH SUCCESS");
    console.log(`Response status: ${response.statusCode}`);
    console.log("========== END PUBLISH DEBUG ==========\n");
    // ============ SUCCESS LOGGING END ============

    return response;
  } catch (error) {
    // ============ ERROR LOGGING ============
    console.error("❌ PUBLISH FAILED");
    console.error(`Error type: ${error.constructor.name}`);
    console.error(`Error message: ${error.message}`);
    
    if (error.output) {
      console.error(`Error status: ${error.output.statusCode}`);
      console.error(`Error payload:`, JSON.stringify(error.output.payload, null, 2));
    }
    
    if (error.data) {
      console.error(`Error data:`, JSON.stringify(error.data, null, 2));
    }
    
    console.error("Full error:", error);
    console.error("========== END PUBLISH DEBUG ==========\n");
    // ============ ERROR LOGGING END ============
    
    throw new Error(
      `Error when publishing to endpoint ${config.publishUrl}/publish: message: ${error.message}`
    );
  }
};