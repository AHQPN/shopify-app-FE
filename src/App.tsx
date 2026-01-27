import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";
import { setAppBridge } from "./services/api";
import HomePage from "./pages/HomePage";
import AdditionalPage from "./pages/AdditionalPage";
import DiscountFeaturePage from "./pages/DiscountFeaturePage";
import ReviewsPage from "./pages/ReviewsPage";

function App() {
  const app = useAppBridge();

  useEffect(() => {
    // Set App Bridge instance for API client
    setAppBridge(app);
    console.log("App Bridge initialized");
  }, [app]);

  return (
    <AppProvider i18n={{}}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/additional" element={<AdditionalPage />} />
        <Route path="/discount-feature" element={<DiscountFeaturePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
      </Routes>
    </AppProvider>
  );
}

export default App;
