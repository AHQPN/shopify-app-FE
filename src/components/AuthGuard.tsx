import { ReactNode } from "react";
import { Page, Card, BlockStack, Text, Spinner, Banner } from "@shopify/polaris";
import { useShopifyAuth } from "../hooks/useShopifyAuth";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Component that ensures user is authenticated before rendering children
 * Handles OAuth flow automatically
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, shop, error } = useShopifyAuth();

  if (isLoading) {
    return (
      <Page title="Authenticating...">
        <Card>
          <BlockStack gap="400" align="center">
            <Spinner size="large" />
            <Text as="p" variant="bodyMd" alignment="center">
              Đang xác thực với Shopify...
            </Text>
            {shop && (
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Shop: {shop}
              </Text>
            )}
          </BlockStack>
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Authentication Error">
        <Banner tone="critical">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              {error}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Vui lòng truy cập app từ Shopify Admin hoặc đảm bảo có tham số ?shop=xxx.myshopify.com
            </Text>
          </BlockStack>
        </Banner>
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page title="Redirecting...">
        <Card>
          <BlockStack gap="400" align="center">
            <Spinner size="large" />
            <Text as="p" variant="bodyMd" alignment="center">
              Đang chuyển hướng đến OAuth...
            </Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
