import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Banner,
  InlineStack,
  Button,
  SkeletonBodyText,
  SettingToggle,
  Badge,
} from "@shopify/polaris";
import apiClient from "../services/api";

interface Settings {
  shop: string;
  discountFeatureEnabled: boolean;
}

interface CalculationResult {
  updated?: number;
  skipped?: number;
  total?: number;
}

export default function DiscountFeaturePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [lastCalculation, setLastCalculation] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get shop from URL params or localStorage
  const getShopDomain = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get("shop");
    if (shopParam) {
      localStorage.setItem("shop", shopParam);
      return shopParam;
    }
    return localStorage.getItem("shop") || "quickstart-f5f1b2e5.myshopify.com";
  };

  const shop = getShopDomain();

  // Load settings - shop is extracted from JWT by backend
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // No need to pass shop - backend extracts from JWT session token
      const response = await apiClient.get(`/settings`);
      setSettings(response.data);
    } catch (err: any) {
      console.error("Error loading settings:", err);
      setError(err.response?.data?.message || "Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Toggle discount feature
  const handleToggle = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setLastCalculation(null);

      const newState = !settings?.discountFeatureEnabled;

      const response = await apiClient.post(`/settings`, {
        discountFeatureEnabled: newState,
      });

      setSettings({
        shop,
        discountFeatureEnabled: newState,
      });

      if (newState && response.data.calculationResult) {
        setLastCalculation(response.data.calculationResult);
        const result = response.data.calculationResult;
        setSuccess(
          `Tính năng đã bật! Đã tính toán discount cho ${result.total || 0} sản phẩm. ` +
          `Cập nhật thành công: ${result.updated || 0}, Bỏ qua: ${result.skipped || 0}`
        );
      } else if (newState) {
        setSuccess("Tính năng discount đã được bật!");
      } else {
        setSuccess("Tính năng discount đã được tắt!");
      }
    } catch (err: any) {
      console.error("Error toggling feature:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật cài đặt");
      // Reload to get correct state
      loadSettings();
    } finally {
      setSaving(false);
    }
  };

  // Manual sync
  const handleManualSync = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setLastCalculation(null);

      const response = await apiClient.post(`/settings`, {
        discountFeatureEnabled: true,
      });

      if (response.data.calculationResult) {
        setLastCalculation(response.data.calculationResult);
        const result = response.data.calculationResult;
        setSuccess(
          `Đồng bộ thành công! Đã tính toán discount cho ${result.total || 0} sản phẩm. ` +
          `Cập nhật: ${result.updated || 0}, Bỏ qua: ${result.skipped || 0}`
        );
      } else {
        setSuccess("Đồng bộ hoàn tất!");
      }

      loadSettings();
    } catch (err: any) {
      console.error("Error syncing:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi đồng bộ");
    } finally {
      setSaving(false);
    }
  };

  const contentStatus = settings?.discountFeatureEnabled ? "Bật" : "Tắt";
  const textStatus = settings?.discountFeatureEnabled ? "Tắt" : "Bật";

  return (
    <Page
      title="Tính năng Discount tự động"
      backAction={{ onAction: () => (window.location.href = "/") }}
    >
      <BlockStack gap="500">
        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        )}

        {success && (
          <Banner tone="success" onDismiss={() => setSuccess(null)}>
            <p>{success}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              {loading ? (
                <SkeletonBodyText lines={3} />
              ) : (
                <SettingToggle
                  action={{
                    content: textStatus,
                    onAction: handleToggle,
                    loading: saving,
                    disabled: saving,
                  }}
                  enabled={settings?.discountFeatureEnabled || false}
                >
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        Tính toán discount tự động
                      </Text>
                      <Badge tone={settings?.discountFeatureEnabled ? "success" : "info"}>
                        {contentStatus}
                      </Badge>
                    </InlineStack>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Khi bật, hệ thống sẽ tự động tính toán phần trăm discount dựa trên
                      price và compare_at_price của sản phẩm, sau đó lưu vào metafield.
                    </Text>
                  </BlockStack>
                </SettingToggle>
              )}
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Thông tin
                </Text>

                <BlockStack gap="300">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      ✓ Công thức tính discount
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Discount % = ((Compare At Price - Price) / Compare At Price) × 100
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      ✓ Metafield tự động
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Namespace: <code>custom</code>, Key: <code>discount_percentage</code>
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      ✓ Shopify API
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Sử dụng GraphQL API để lấy thông tin sản phẩm và cập nhật metafield
                    </Text>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {settings?.discountFeatureEnabled && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Đồng bộ thủ công
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Tính toán lại discount cho tất cả sản phẩm ngay lập tức
                  </Text>

                  {lastCalculation && (
                    <Banner>
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Kết quả lần đồng bộ cuối:
                        </Text>
                        <InlineStack gap="400">
                          <Text as="p">Tổng: {lastCalculation.total}</Text>
                          <Text as="p">Thành công: {lastCalculation.updated}</Text>
                          <Text as="p">Bỏ qua: {lastCalculation.skipped}</Text>
                        </InlineStack>
                      </BlockStack>
                    </Banner>
                  )}

                  <InlineStack gap="200">
                    <Button
                      onClick={handleManualSync}
                      loading={saving}
                      disabled={saving}
                      variant="primary"
                    >
                      Đồng bộ ngay
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}

        {!settings?.discountFeatureEnabled && (
          <Layout>
            <Layout.Section>
              <Banner tone="info">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Tính năng đang tắt
                  </Text>
                  <Text as="p" variant="bodySm">
                    Bật tính năng để tự động tính toán discount cho tất cả sản phẩm
                  </Text>
                </BlockStack>
              </Banner>
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>
    </Page>
  );
}
