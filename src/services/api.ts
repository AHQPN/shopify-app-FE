import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_SPRING_API_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Store App Bridge instance for session token
let appBridgeInstance: any = null;

export function setAppBridge(app: any) {
  appBridgeInstance = app;
}

// Request interceptor to add session token
apiClient.interceptors.request.use(
  async (config) => {
    // Get session token from App Bridge if available
    if (appBridgeInstance) {
      try {
        // App Bridge v4: app.idToken() returns the session token
        if (appBridgeInstance.idToken) {
          const sessionToken = await appBridgeInstance.idToken();
          config.headers.Authorization = `Bearer ${sessionToken}`;
        }
      } catch (error) {
        console.error("Failed to get session token:", error);
      }
    }

    // Always inject 'shop' parameter from URL if present (Critical for fallback auth)
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    if (shop) {
      config.params = config.params || {};
      config.params.shop = shop;
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      hasAuthHeader: !!config.headers.Authorization,
      shopParam: shop
    });

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and data unwrapping
apiClient.interceptors.response.use(
  (response) => {
    // Check if response conforms to ApiResponse structure
    const data = response.data;
    if (data && typeof data.code === "number") {
      // Success code: 1000 (as defined in backend ErrorCode)
      if (data.code === 1000) {
        // Unwrap the 'data' field so components get direct access to payload
        // Also keep original response structure if needed, but usually we just want data
        // Modifying response.data to be the actual payload
        response.data = data.data;
        return response;
      } else {
        // Business logic error within 200 OK wrapper
        console.error(`API Error ${data.code}: ${data.message}`);
        return Promise.reject({
          message: data.message,
          code: data.code,
          response: response
        });
      }
    }
    return response;
  },
  (error) => {
    // Network errors or non-200 status codes
    if (error.response?.status === 401) {
      // Check if auth is required / Backend returns ApiResponse for 401 too?
      // Assuming simple Map was returned before, now it might be ApiResponse
      // But standard 401 usually comes from security filter.
      // Let's check if body has authUrl
      const data = error.response?.data;

      // If it's standardized error
      if (data?.code && data?.message) {
        console.error(`API Error ${data.code}: ${data.message}`);
      }

      // Check legacy/redirect param
      if (data?.authRequired && data?.authUrl) {
        console.log("Auth required, redirecting to:", data.authUrl);
        window.location.href = data.authUrl;
        return Promise.reject(new Error("Redirecting to OAuth..."));
      }

      // Handle other unauthorized errors
      console.error("Unauthorized access");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API Service methods - to be implemented when Spring Boot is ready
export const shopifyApi = {
  // Session management
  getSession: () => apiClient.get("/session"),

  // Shopify operations
  getShopData: (shop: string) => apiClient.get(`/shop/${shop}`),

  // Webhook handlers will be called by Spring Boot backend

  // Example: Product operations
  getProducts: () => apiClient.get("/products"),
  getProduct: (id: string) => apiClient.get(`/products/${id}`),
};
