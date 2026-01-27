import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Layout, Card, Text, BlockStack, Button, Banner, InlineStack, Badge } from "@shopify/polaris";
import apiClient from "../services/api";

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState<"loading" | "online" | "offline">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await apiClient.get("/health");
        setBackendStatus("online");
      } catch (err) {
        setBackendStatus("offline");
      }
    };
    checkBackend();
  }, []);

  return (
    <Page
      title="Shopify App - Spring Boot Backend"
      primaryAction={{
        content: "Tính năng Discount",
        onAction: () => navigate("/discount-feature"),
      }}
      secondaryActions={[
        {
          content: "Additional Page",
          onAction: () => navigate("/additional"),
        },
      ]}
    >
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    🎉 Frontend đã sẵn sàng!
                  </Text>
                  <Badge tone="success">React + Vite</Badge>
                </InlineStack>

                <Text as="p" variant="bodyMd">
                  Giao diện React SPA đã được cấu hình và đang chạy.
                  Frontend sẵn sàng kết nối với Spring Boot backend.
                </Text>

                <Banner tone="info">
                  <Text as="p" variant="bodyMd">
                    <strong>Bước tiếp theo:</strong> Tạo Spring Boot backend tại <code>http://localhost:8080</code>
                  </Text>
                </Banner>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  ⚡ Tính năng Discount tự động
                </Text>
                <Text as="p" variant="bodyMd">
                  Tự động tính toán phần trăm discount dựa trên price và compare_at_price của sản phẩm.
                </Text>
                <Button onClick={() => navigate("/discount-feature")} variant="primary">
                  Quản lý Discount
                </Button>
                <div style={{ height: '10px' }}></div>
                <Button onClick={() => navigate("/reviews")}>
                  Quản lý Reviews (New)
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Backend Status
                </Text>
                {backendStatus === "loading" && <Badge>Đang kiểm tra...</Badge>}
                {backendStatus === "online" && <Badge tone="success">✓ Đang chạy</Badge>}
                {backendStatus === "offline" && <Badge tone="warning">Chưa khởi động</Badge>}
                <Text as="p" tone="subdued">
                  {backendStatus === "online" ? "Spring Boot đã sẵn sàng" : "Spring Boot API chưa được khởi động"}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Tính năng đã cấu hình
                </Text>

                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">✅</Text>
                    <Text as="p">React Router - Client-side routing</Text>
                  </InlineStack>

                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">✅</Text>
                    <Text as="p">Shopify Polaris UI Components</Text>
                  </InlineStack>

                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">✅</Text>
                    <Text as="p">Shopify App Bridge Integration</Text>
                  </InlineStack>

                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">✅</Text>
                    <Text as="p">Axios API Client với Interceptors</Text>
                  </InlineStack>

                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">⏳</Text>
                    <Text as="p">Spring Boot Backend (đang chờ)</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  API Configuration
                </Text>

                <Text as="p" tone="subdued">
                  Frontend được cấu hình để gọi API tại:
                </Text>

                <code style={{
                  display: 'block',
                  padding: '12px',
                  background: '#f6f6f7',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  {import.meta.env.VITE_SPRING_API_URL || 'http://localhost:8080'}
                </code>

                <Text as="p" tone="subdued" variant="bodySm">
                  Xem chi tiết trong file: <strong>src/services/api.ts</strong>
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  📚 Tài liệu
                </Text>

                <Text as="p">
                  Xem <strong>SPRING_MIGRATION.md</strong> để biết chi tiết về:
                </Text>

                <BlockStack gap="200">
                  <Text as="p" tone="subdued">• Cấu trúc Spring Boot cần tạo</Text>
                  <Text as="p" tone="subdued">• Database schema & JPA entities</Text>
                  <Text as="p" tone="subdued">• API endpoints cần implement</Text>
                  <Text as="p" tone="subdued">• Shopify OAuth & Webhook handlers</Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
