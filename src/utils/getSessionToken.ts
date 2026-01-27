/**
 * Get session token from App Bridge
 * This token is a JWT that contains shop info and is signed by Shopify
 */
export async function getSessionToken(app: any): Promise<string> {
  try {
    // App Bridge v4
    if (app && app.idToken) {
      return await app.idToken();
    }
    throw new Error("App Bridge instance does not support idToken()");
  } catch (error) {
    console.error("Failed to get session token:", error);
    throw error;
  }
}
