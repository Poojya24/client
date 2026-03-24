import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductPage from "./pages/ProductPage";
import UploadDetailsPage from "./pages/UploadDetailsPage";
import InvoicePage from "./pages/InvoicePage";
import InvoiceDocumentPage from "./pages/InvoiceDocumentPage";
import SettingsPage from "./pages/SettingsPage";
import ImageOnlyPage from "./pages/ImageOnlyPage";
import OtpPage from "./pages/OtpPage";
import ResetPassword from "./pages/ResetPassword";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<DashboardPage variant="overview" />} />
      <Route path="/statistics" element={<DashboardPage variant="statistics" />} />

      <Route path="/products" element={<ProductPage variant="list" />} />
      <Route path="/products/1" element={<ProductPage variant="buy" />} />
      <Route path="/products/upload" element={<ProductPage variant="choose-upload" />} />
      <Route path="/csv-upload" element={<ProductPage variant="csv-step-1" />} />
      <Route path="/csv-upload/confirmation" element={<ProductPage variant="csv-step-2" />} />
      <Route path="/upload-details" element={<UploadDetailsPage />} />

      <Route path="/invoice" element={<InvoicePage variant="list" />} />
      <Route path="/invoice/view" element={<InvoicePage variant="view" />} />
      <Route path="/invoice/remove" element={<InvoicePage variant="remove" />} />
      <Route path="/invoice/full-height" element={<InvoiceDocumentPage variant="full" />} />
      <Route path="/invoice/full-height-1" element={<InvoiceDocumentPage variant="compact" />} />

      <Route path="/settings" element={<SettingsPage />} />

      <Route path="/group" element={<ImageOnlyPage imageName="Group.png" title="Group" />} />
      <Route path="/frame" element={<ImageOnlyPage imageName="Frame 1948754811.png" title="Frame" />} />
      <Route
        path="/concept"
        element={<ImageOnlyPage imageName="Concept of data analysis and maintenance.png" title="Concept" />}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;