import { useEffect, useState } from "react";
import apiClient from "../services/api";

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  shop: string | null;
  error: string | null;
}

/**
 * Hook to handle Shopify OAuth authentication
 * Checks if shop has valid access token, if not redirects to OAuth
 */
export function useShopifyAuth(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isLoading: true,
    shop: null,
    error: null,
  });

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Get shop from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        let shopParam = urlParams.get("shop");
        
        // Fallback to localStorage if no URL param
        if (!shopParam) {
          shopParam = localStorage.getItem("shop");
        }
        
        // Fallback to default shop for development
        if (!shopParam) {
          shopParam = "quickstart-f5f1b2e5.myshopify.com";
          console.log("Using default shop for development:", shopParam);
        }

        // Save shop to localStorage
        localStorage.setItem("shop", shopParam);

        // Check if we have a valid session in backend
        try {
          const response = await apiClient.get(`/test/sessions/${shopParam}`);
          
          if (response.data.found) {
            // Token exists, we're authenticated
            setStatus({
              isAuthenticated: true,
              isLoading: false,
              shop: shopParam,
              error: null,
            });
            return;
          }
        } catch (err) {
          console.log("No existing session, initiating OAuth");
        }

        // No token found - initiate OAuth
        console.log("Initiating OAuth for shop:", shopParam);
        console.log("Calling API:", `/auth?shop=${shopParam}`);
        
        const authResponse = await apiClient.get(`/auth?shop=${shopParam}`);
        console.log("Auth response:", authResponse.data);
        
        const authUrl = authResponse.data.authUrl;

        if (authUrl) {
          // Redirect to Shopify OAuth
          console.log("Redirecting to:", authUrl);
          window.location.href = authUrl;
        } else {
          console.error("No authUrl in response:", authResponse.data);
          setStatus({
            isAuthenticated: false,
            isLoading: false,
            shop: shopParam,
            error: "Failed to generate OAuth URL. Check console for details.",
          });
        }
      } catch (err: any) {
        console.error("Authentication error:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        
        let errorMessage = "Authentication failed";
        
        if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
          errorMessage = "Cannot connect to backend. Make sure backend is running at " + 
            (import.meta.env.VITE_SPRING_API_URL || "http://localhost:8080");
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setStatus({
          isAuthenticated: false,
          isLoading: false,
          shop: null,
          error: errorMessage,
        });
      }
    };

    authenticate();
  }, []);

  return status;
}
