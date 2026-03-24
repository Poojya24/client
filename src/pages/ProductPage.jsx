import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { api, authStore } from "../services/api";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

function ProductPage({ variant }) {
  useAuthGuard();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");

  const [buyOpen, setBuyOpen] = useState(variant === "buy");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");

  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);

  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  const modalOpen = buyOpen || variant === "choose-upload" || variant === "csv-step-1" || variant === "csv-step-2";

  const loadData = async (page = 1, keyword = "") => {
    try {
      setError("");
      const [sum, list] = await Promise.all([api.getInventorySummary(), api.getProducts(page, keyword)]);
      setSummary(sum || {});
      setProducts(list?.products || []);
      setMeta({ page: list?.page || 1, pages: list?.pages || 1, total: list?.total || 0 });

      if (!selectedProduct && Array.isArray(list?.products) && list.products.length > 0) {
        setSelectedProduct(list.products[0]);
      }
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("token") || (err.message || "").includes("401")) {
        authStore.clear();
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load products");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const onPrev = () => {
    if (meta.page > 1) {
      loadData(meta.page - 1, search);
    }
  };

  const onNext = () => {
    if (meta.page < meta.pages) {
      loadData(meta.page + 1, search);
    }
  };

  const onRowClick = (product) => {
    setSelectedProduct(product);
    setQuantity("1");
    setBuyOpen(true);
  };

  const onBuy = async () => {
    if (!selectedProduct?._id) {
      setError("Select a product first");
      return;
    }

    try {
      const qty = Number(quantity) || 1;
      await api.buyProduct(selectedProduct._id, qty);
      setActionMessage("Purchase successful. Inventory and invoices updated.");
      setBuyOpen(false);
      await loadData(meta.page, search);
    } catch (err) {
      setError(err.message || "Buy failed");
      setActionMessage("");
    }
  };

  const onUploadCsv = async () => {
    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    try {
      const result = await api.uploadProductsCsv(csvFile);
      setCsvResult(result);
      setActionMessage(`CSV processed: ${result.count || 0} rows accepted`);
      setError("");
      await loadData(1, search);
    } catch (err) {
      setError(err.message || "CSV upload failed");
      setActionMessage("");
    }
  };

  const rows = useMemo(() => products, [products]);

  return (
    <AppShell title="Products" onSearch={setSearch} searchValue={search} blurred={false}>
      {error ? <p className="api-error">{error}</p> : null}
      {actionMessage ? <p className="api-info">{actionMessage}</p> : null}

      <div className={modalOpen ? "content-blur" : ""}>
        <section className="card overview-card">
          <h3>Overall Inventory</h3>
          <div className="summary-row four-cols">
            <div><h4>Categories</h4><p>{summary.categoriesCount || 0}</p><small>Last 7 days</small></div>
            <div><h4>Total Products</h4><p>{summary.totalProducts || 0} <span>{INR.format(summary.totalValue || 0)}</span></p><small>Last 7 days <span>Revenue</span></small></div>
            <div><h4>Top Selling</h4><p>{summary.topSellingCount || 0} <span>{INR.format(summary.topSellingValue || 0)}</span></p><small>Last 7 days <span>Cost</span></small></div>
            <div><h4>Low Stocks</h4><p>{summary.lowStockCount || 0} <span>{summary.outOfStockCount || 0}</span></p><small>Low stock <span>Not in stock</span></small></div>
          </div>
        </section>

        <section className="card table-card">
          <div className="card-head-inline">
            <h3>Products</h3>
            <button type="button" className="primary-btn" onClick={() => navigate("/products/upload")}>Add Product</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id || p.productId} onClick={() => onRowClick(p)} className={selectedProduct?._id === p._id ? "highlight" : ""}>
                  <td>
                    {p.image ? <img src={p.image.startsWith("/uploads") ? `http://localhost:5000${p.image}` : p.image} alt={p.name} className="table-thumb" /> : <span className="thumb-fallback">IMG</span>}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{INR.format(p.price || 0)}</td>
                  <td>{p.quantity} {p.unit || ""}</td>
                  <td className={`status ${(p.status || "").includes("Out") ? "out" : (p.status || "").includes("Low") ? "low" : "in"}`}>{p.status || "In stock"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <button type="button" className="ghost" onClick={onPrev} disabled={meta.page <= 1}>Previous</button>
            <span>Page {meta.page} of {meta.pages}</span>
            <button type="button" className="ghost" onClick={onNext} disabled={meta.page >= meta.pages}>Next</button>
          </div>
        </section>

        <section className="meta-note">Click any product row to open Buy Simulation. Expiry: {selectedProduct ? formatDate(selectedProduct.expiryDate) : "-"}</section>
      </div>

      {buyOpen ? (
        <div className="center-modal product-buy-modal">
          <button type="button" className="primary-btn wide">Simulate Buy Product</button>
          <div className="buy-product-name">{selectedProduct?.name || "No product selected"}</div>
          <input type="number" min="1" placeholder="Enter quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <div className="modal-actions-inline">
            <button type="button" className="ghost" onClick={() => setBuyOpen(false)}>Cancel</button>
            <button type="button" className="primary-btn small" onClick={onBuy}>Buy</button>
          </div>
        </div>
      ) : null}

      {variant === "choose-upload" ? (
        <div className="center-modal choose-upload-modal">
          <button type="button" className="primary-btn wide" onClick={() => navigate("/upload-details")}>Individual product</button>
          <button type="button" className="primary-btn wide" onClick={() => navigate("/csv-upload")}>Multiple product</button>
        </div>
      ) : null}

      {variant === "csv-step-1" || variant === "csv-step-2" ? (
        <div className="csv-modal">
          <div className="csv-head"><h3>CSV Upload</h3><button type="button" onClick={() => navigate("/products")}>x</button></div>
          <p>Add your documents here</p>
          <div className="drop-area">
            <div className="folder-icon">CSV</div>
            <strong>Drag your file(s) to start uploading</strong>
            <span>OR</span>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          </div>

          {csvFile ? <div className="file-chip"><span>{csvFile.name}</span><span>{(csvFile.size / (1024 * 1024)).toFixed(2)}MB</span></div> : null}
          {csvResult ? (
            <div className="csv-result">
              <p>Accepted: {csvResult.acceptedRows?.length || 0}</p>
              <p>Rejected: {csvResult.rejectedRows?.length || 0}</p>
            </div>
          ) : null}

          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => navigate("/products")}>Cancel</button>
            <button type="button" className="primary-btn" onClick={onUploadCsv}>Upload</button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default ProductPage;
