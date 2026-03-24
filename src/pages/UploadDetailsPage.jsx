import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { api, authStore } from "../services/api";

function UploadDetailsPage() {
  useAuthGuard();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    productId: "",
    category: "",
    price: "",
    quantity: "",
    unit: "",
    expiryDate: "",
    thresholdValue: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onImageChange = (file) => {
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const onSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      let imagePath = "";
      if (imageFile) {
        const uploadRes = await api.uploadProductImage(imageFile);
        imagePath = uploadRes?.image || "";
      }

      const payload = {
        ...form,
        image: imagePath,
        price: Number(form.price),
        quantity: Number(form.quantity),
        thresholdValue: Number(form.thresholdValue)
      };

      await api.createProduct(payload);
      navigate("/products");
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("token") || (err.message || "").includes("401")) {
        authStore.clear();
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Products" active="Products" showSearch={false}>
      <div className="breadcrumb">Add Product &gt; Individual Product</div>
      <section className="card form-card">
        <h3>New Product</h3>
        {error ? <p className="api-error">{error}</p> : null}
        <div className="form-grid">
          <div className="upload-box">
            {imagePreview ? <img src={imagePreview} alt="preview" className="upload-preview" /> : <div className="square" />}
            <span>Drag image here</span>
            <small>or</small>
            <input type="file" accept="image/*" onChange={(e) => onImageChange(e.target.files?.[0] || null)} />
          </div>
          <label>Product Name<input placeholder="Enter product name" value={form.name} onChange={(e) => onChange("name", e.target.value)} /></label>
          <label>Product ID<input placeholder="Enter product ID" value={form.productId} onChange={(e) => onChange("productId", e.target.value)} /></label>
          <label>Category<input placeholder="Enter product category" value={form.category} onChange={(e) => onChange("category", e.target.value)} /></label>
          <label>Price<input type="number" placeholder="Enter price" value={form.price} onChange={(e) => onChange("price", e.target.value)} /></label>
          <label>Quantity<input type="number" placeholder="Enter product quantity" value={form.quantity} onChange={(e) => onChange("quantity", e.target.value)} /></label>
          <label>Unit<input placeholder="e.g. kg, pcs, litre" value={form.unit} onChange={(e) => onChange("unit", e.target.value)} /></label>
          <label>Expiry Date<input type="date" value={form.expiryDate} onChange={(e) => onChange("expiryDate", e.target.value)} /></label>
          <label>Threshold Value<input type="number" placeholder="Low stock level" value={form.thresholdValue} onChange={(e) => onChange("thresholdValue", e.target.value)} /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="link-button" onClick={() => navigate("/products")}>Discard</button>
          <button type="button" className="primary-btn" onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : "Add Product"}</button>
        </div>
      </section>
    </AppShell>
  );
}

export default UploadDetailsPage;
