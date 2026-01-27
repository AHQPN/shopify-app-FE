import { useNavigate } from "react-router-dom";
import { Page, Layout, Card, Text, BlockStack, List, Link } from "@shopify/polaris";

export default function AdditionalPage() {
  const navigate = useNavigate();

  return (
    <Page
      title="Additional Page"
      backAction={{ content: "Home", onAction: () => navigate("/") }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Multiple pages
              </Text>
              
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which demonstrates how
                to create multiple pages within app navigation using{" "}
                <Link url="https://shopify.dev/docs/apps/tools/app-bridge" target="_blank">
                  App Bridge
                </Link>
                .
              </Text>
              
              <Text as="p" variant="bodyMd">
                To create your own page and have it show up in the app navigation:
              </Text>

              <List type="number">
                <List.Item>
                  Add a new page component in <code>src/pages/</code>
                </List.Item>
                <List.Item>
                  Add a route in <code>src/App.tsx</code>
                </List.Item>
                <List.Item>
                  Add navigation links as needed
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              
              <BlockStack gap="300">
                <Link url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav" target="_blank">
                  App nav best practices
                </Link>
                
                <Link url="https://polaris.shopify.com/" target="_blank">
                  Shopify Polaris Design System
                </Link>
                
                <Link url="https://shopify.dev/docs/api" target="_blank">
                  Shopify API Documentation
                </Link>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
