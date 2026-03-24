import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { api, authStore } from "../services/api";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const DEMO_INVOICES = [
  { _id: "demo-1", invoiceId: "INV-1001", referenceNumber: "INV-052", amount: 2450, status: "Paid", dueDate: new Date(), isDemo: true, items: [] },
  { _id: "demo-2", invoiceId: "INV-1002", referenceNumber: "INV-047", amount: 1850, status: "Unpaid", dueDate: new Date(), isDemo: true, items: [] },
  { _id: "demo-3", invoiceId: "INV-1003", referenceNumber: "INV-057", amount: 3620, status: "Paid", dueDate: new Date(), isDemo: true, items: [] },
  { _id: "demo-4", invoiceId: "INV-1004", referenceNumber: "INV-153", amount: 950, status: "Unpaid", dueDate: new Date(), isDemo: true, items: [] },
  { _id: "demo-5", invoiceId: "INV-1005", referenceNumber: "INV-507", amount: 4100, status: "Paid", dueDate: new Date(), isDemo: true, items: [] },
];

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

function InvoicePage() {
  useAuthGuard();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [activeMenu, setActiveMenu] = useState("");
  const [viewInvoice, setViewInvoice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const blurred = Boolean(viewInvoice || deleteTarget);

  const loadData = async (page = 1, keyword = search) => {
    try {
      setError("");
      const [statsRes, listRes] = await Promise.all([api.getInvoiceStats(), api.getInvoices(page, keyword)]);

      const apiInvoices = listRes?.invoices || [];
      const hasApiData = apiInvoices.length > 0;

      setStats(statsRes || {});
      setInvoices(hasApiData ? apiInvoices : DEMO_INVOICES);
      setMeta({ page: listRes?.page || 1, pages: listRes?.pages || 1 });

      if (!hasApiData) {
        setActionMessage("No real invoices found. Showing demo invoice data.");
      }
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("token") || (err.message || "").includes("401")) {
        authStore.clear();
        navigate("/login", { replace: true });
        return;
      }
      setInvoices(DEMO_INVOICES);
      setError(err.message || "Failed to load invoices. Showing demo data.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const displayRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((inv) =>
      [inv.invoiceId, inv.referenceNumber, inv.status, formatDate(inv.dueDate)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [invoices, search]);

  const isDemoMode = displayRows.some((r) => r.isDemo);

  const onPrev = () => {
    if (meta.page > 1 && !isDemoMode) {
      loadData(meta.page - 1, search);
    }
  };

  const onNext = () => {
    if (meta.page < meta.pages && !isDemoMode) {
      loadData(meta.page + 1, search);
    }
  };

  const onToggleStatus = async (invoice) => {
    try {
      const nextStatus = invoice.status === "Paid" ? "Unpaid" : "Paid";

      if (invoice.isDemo) {
        setInvoices((prev) => prev.map((inv) => (inv._id === invoice._id ? { ...inv, status: nextStatus } : inv)));
      } else {
        await api.updateInvoiceStatus(invoice._id, nextStatus);
        await loadData(meta.page, search);
      }

      setActionMessage(`Invoice ${invoice.invoiceId} marked ${nextStatus}`);
      setActiveMenu("");
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const onViewInvoice = async (invoice) => {
    if (invoice.status !== "Paid") {
      setError("Only paid invoices can be viewed");
      return;
    }

    try {
      if (invoice.isDemo) {
        setViewInvoice(invoice);
      } else {
        const doc = await api.getInvoiceById(invoice._id);
        setViewInvoice(doc);
      }
      setActiveMenu("");
    } catch (err) {
      setError(err.message || "Failed to fetch invoice");
    }
  };

  const onDeleteInvoice = async () => {
    if (!deleteTarget?._id) return;

    try {
      if (deleteTarget.isDemo) {
        setInvoices((prev) => prev.filter((inv) => inv._id !== deleteTarget._id));
      } else {
        await api.deleteInvoice(deleteTarget._id);
        await loadData(meta.page, search);
      }

      setActionMessage("Invoice removed");
      setDeleteTarget(null);
      setActiveMenu("");
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const recentTransactionsCount = Array.isArray(stats.recentTransactions) ? stats.recentTransactions.length : displayRows.length;

  return (
    <AppShell title="Invoices" blurred={blurred} onSearch={setSearch} searchValue={search}>
      {error ? <p className="api-error">{error}</p> : null}
      {actionMessage ? <p className="api-info">{actionMessage}</p> : null}

      <section className="card overview-card">
        <h3>Overall Invoice</h3>
        <div className="summary-row four-cols">
          <div><h4>Recent Transactions</h4><p>{recentTransactionsCount}</p><small>Recently generated invoices</small></div>
          <div><h4>Total Invoices</h4><p>{stats.totalInvoicesLast7Days || displayRows.length} <span>{stats.totalInvoicesPaid || displayRows.filter((x) => x.status === "Paid").length}</span></p><small>Last 7 days <span>Total paid</span></small></div>
          <div><h4>Paid Amount</h4><p>{INR.format(stats.paidAmount || displayRows.filter((x) => x.status === "Paid").reduce((a, b) => a + (b.amount || 0), 0))}</p><small>Total paid amount</small></div>
          <div><h4>Unpaid Amount</h4><p>{INR.format(stats.unpaidAmount || displayRows.filter((x) => x.status === "Unpaid").reduce((a, b) => a + (b.amount || 0), 0))}</p><small>Total unpaid amount</small></div>
        </div>
      </section>

      <section className="card table-card invoice-table">
        <h3>Invoices List</h3>
        <table>
          <thead>
            <tr><th>Invoice ID</th><th>Reference Number</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {displayRows.map((inv) => (
              <tr key={inv._id}>
                <td>{inv.invoiceId}</td>
                <td>{inv.referenceNumber}</td>
                <td>{INR.format(inv.amount || 0)}</td>
                <td className={inv.status === "Paid" ? "status in" : "status out"}>{inv.status}</td>
                <td>{formatDate(inv.dueDate)}</td>
                <td className="actions-cell">
                  <button type="button" className="ghost" onClick={() => setActiveMenu((prev) => (prev === inv._id ? "" : inv._id))}>{"\u22EE"}</button>
                  {activeMenu === inv._id ? (
                    <div className="actions-menu">
                      <button type="button" onClick={() => onToggleStatus(inv)}>{inv.status === "Paid" ? "Mark Unpaid" : "Mark Paid"}</button>
                      <button type="button" onClick={() => onViewInvoice(inv)} disabled={inv.status !== "Paid"}>View Invoice</button>
                      <button type="button" onClick={() => setDeleteTarget(inv)}>Delete Invoice</button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <button type="button" className="ghost" onClick={onPrev} disabled={meta.page <= 1 || isDemoMode}>Previous</button>
          <span>Page {isDemoMode ? 1 : meta.page} of {isDemoMode ? 1 : meta.pages}</span>
          <button type="button" className="ghost" onClick={onNext} disabled={meta.page >= meta.pages || isDemoMode}>Next</button>
        </div>
      </section>

      {viewInvoice ? (
        <div className="invoice-view-modal">
          <div className="float-actions">
            <button onClick={() => setViewInvoice(null)}>x</button>
            <button>d</button>
            <button>p</button>
          </div>
          <div className="doc-card" style={{ padding: "16px" }}>
            <h3 style={{ marginTop: 0 }}>INVOICE {viewInvoice.invoiceId}</h3>
            <p>Reference Number: {viewInvoice.referenceNumber}</p>
            <p>Status: {viewInvoice.status}</p>
            <p>Due Date: {formatDate(viewInvoice.dueDate)}</p>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                {(viewInvoice.items || []).length ? (viewInvoice.items || []).map((item, idx) => (
                  <tr key={`${item._id || idx}`}>
                    <td>{item.product?.name || "-"}</td>
                    <td>{item.quantity}</td>
                    <td>{INR.format(item.price || 0)}</td>
                  </tr>
                )) : <tr><td>Sample product</td><td>1</td><td>{INR.format(500)}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="confirm-strip">
          <p>This invoice will be deleted.</p>
          <div>
            <button type="button" className="ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button type="button" className="primary-btn" onClick={onDeleteInvoice}>Confirm</button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default InvoicePage;
