import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { api, authStore } from "../services/api";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const defaultStatLayout = [
  { id: "total-revenue", position: 0 },
  { id: "products-sold", position: 1 },
  { id: "products-in-stock", position: 2 },
];

function Bars({ graph }) {
  const values = useMemo(() => {
    if (!Array.isArray(graph) || graph.length === 0) {
      return { purchases: [48, 51, 39, 31, 38, 24, 30, 25, 39, 27], sales: [43, 42, 46, 38, 40, 35, 27, 23, 38, 31] };
    }

    const lastTen = graph.slice(-10);
    const max = Math.max(...lastTen.map((g) => Math.max(g.purchases || 0, g.sales || 0)), 1);

    return {
      purchases: lastTen.map((g) => Math.max(8, Math.round(((g.purchases || 0) / max) * 55))),
      sales: lastTen.map((g) => Math.max(8, Math.round(((g.sales || 0) / max) * 55))),
    };
  }, [graph]);

  return (
    <div className="bar-chart">
      {values.purchases.map((v, i) => (
        <div className="bar-row" key={`${v}-${i}`}>
          <span className="bar blue" style={{ height: `${v * 5}px` }} />
          <span className="bar green" style={{ height: `${values.sales[i] * 5}px` }} />
        </div>
      ))}
    </div>
  );
}

function DashboardPage({ variant }) {
  useAuthGuard();
  const navigate = useNavigate();
  const isStats = variant === "statistics";
  const [data, setData] = useState({});
  const [graph, setGraph] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [layout, setLayout] = useState(defaultStatLayout);
  const [dragId, setDragId] = useState("");
  const [error, setError] = useState("");

  const statCards = {
    "total-revenue": {
      title: "Total Revenue",
      value: INR.format(data?.topStatisticCards?.totalRevenue || 0),
      note: "From paid invoices",
      cls: "yellow",
    },
    "products-sold": {
      title: "Products Sold",
      value: data?.topStatisticCards?.productsSold || 0,
      note: "Total sold quantity",
      cls: "cyan",
    },
    "products-in-stock": {
      title: "Products In Stock",
      value: data?.topStatisticCards?.productsInStock || 0,
      note: "Current inventory",
      cls: "violet",
    },
  };

  const orderedStats = [...layout].sort((a, b) => a.position - b.position);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [summary, graphData, topSelling, productsRes, profile] = await Promise.all([
          api.getSummaryStats(),
          api.getGraphData(),
          api.getTopSelling(),
          api.getProducts(1),
          api.getProfile(),
        ]);

        if (!mounted) return;

        setData(summary || {});
        setGraph(Array.isArray(graphData) ? graphData : []);

        const topFromSales = Array.isArray(topSelling)
          ? topSelling.map((item) => item?.productDetails?.name).filter(Boolean)
          : [];
        const topFromInventory = Array.isArray(productsRes?.products)
          ? productsRes.products.map((p) => p?.name).filter(Boolean)
          : [];
        setTopProducts((topFromSales.length ? topFromSales : topFromInventory).slice(0, 6));

        const serverLayout = Array.isArray(profile?.statisticsLayout) && profile.statisticsLayout.length
          ? profile.statisticsLayout
          : defaultStatLayout;
        setLayout(serverLayout);
      } catch (err) {
        if ((err.message || "").toLowerCase().includes("token") || (err.message || "").includes("401")) {
          authStore.clear();
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message || "Failed to load dashboard");
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const persistLayout = async (nextLayout) => {
    try {
      await api.updateLayout(nextLayout);
    } catch {
      // keep UI optimistic; background save failure can be retried later
    }
  };

  const onDropCard = (targetId) => {
    if (!dragId || dragId === targetId) return;

    const ordered = [...layout].sort((a, b) => a.position - b.position);
    const from = ordered.findIndex((x) => x.id === dragId);
    const to = ordered.findIndex((x) => x.id === targetId);
    if (from === -1 || to === -1) return;

    const moved = [...ordered];
    const [item] = moved.splice(from, 1);
    moved.splice(to, 0, item);

    const normalized = moved.map((x, idx) => ({ ...x, position: idx }));
    setLayout(normalized);
    persistLayout(normalized);
    setDragId("");
  };

  const salesCount = data?.salesOverview?.salesCount || 0;
  const revenue = data?.salesOverview?.totalSalesValue || 0;
  const purchaseCount = data?.purchaseOverview?.purchaseCount || 0;
  const purchaseValue = data?.purchaseOverview?.totalPurchaseValue || 0;
  const totalInStock = data?.inventorySummary?.totalItemsInStock || 0;
  const lowStockCount = data?.inventorySummary?.lowStockCount || 0;
  const totalProducts = data?.productSummary?.totalProducts || 0;
  const categoriesCount = data?.productSummary?.categoriesCount || 0;

  return (
    <AppShell title={isStats ? "Statistics" : "Home"}>
      {error ? <p className="api-error">{error}</p> : null}

      {isStats ? (
        <div className="stats-tiles-row">
          {orderedStats.map((slot) => {
            const card = statCards[slot.id];
            if (!card) return null;
            return (
              <article
                key={slot.id}
                className={`metric-tile ${card.cls} draggable-card`}
                draggable
                onDragStart={() => setDragId(slot.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropCard(slot.id)}
                title="Drag to reorder"
              >
                <h4>{card.title}</h4>
                <h3>{card.value}</h3>
                <p>{card.note}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card-grid home-top">
          <article className="card wide">
            <h3>Sales Overview</h3>
            <div className="mini-stats four">
              <div className="mini-stat"><span className="icon-dot blue" /><strong>{salesCount}</strong><p>Sales</p></div>
              <div className="mini-stat"><span className="icon-dot yellow" /><strong>{INR.format(revenue)}</strong><p>Revenue</p></div>
              <div className="mini-stat"><span className="icon-dot teal" /><strong>{INR.format(Math.max(revenue - purchaseValue, 0))}</strong><p>Profit</p></div>
              <div className="mini-stat"><span className="icon-dot pink" /><strong>{INR.format(purchaseValue)}</strong><p>Cost</p></div>
            </div>
          </article>
          <article className="card side">
            <h3>Inventory Summary</h3>
            <div className="mini-stats two">
              <div className="mini-stat"><span className="summary-icon inventory">I</span><strong>{totalInStock}</strong><p>In Stock</p></div>
              <div className="mini-stat"><span className="summary-icon low">L</span><strong>{lowStockCount}</strong><p>Low / out stock</p></div>
            </div>
          </article>
          <article className="card wide">
            <h3>Purchase Overview</h3>
            <div className="mini-stats four">
              <div className="mini-stat"><strong>{purchaseCount}</strong><p>Purchase</p></div>
              <div className="mini-stat"><strong>{INR.format(purchaseValue)}</strong><p>Cost</p></div>
              <div className="mini-stat"><strong>0</strong><p>Cancel</p></div>
              <div className="mini-stat"><strong>{INR.format(0)}</strong><p>Return</p></div>
            </div>
          </article>
          <article className="card side">
            <h3>Product Summary</h3>
            <div className="mini-stats two">
              <div className="mini-stat"><span className="summary-icon product">P</span><strong>{totalProducts}</strong><p>Number of Products</p></div>
              <div className="mini-stat"><span className="summary-icon category">C</span><strong>{categoriesCount}</strong><p>Number of Categories</p></div>
            </div>
          </article>
        </div>
      )}

      <div className="chart-row">
        <article className="card chart-main">
          <div className="card-head-inline">
            <h3>Sales & Purchase</h3>
            <button type="button" className="soft-btn">Weekly</button>
          </div>
          <Bars graph={graph} />
          <div className="legend-row"><span className="dot blue" />Purchase <span className="dot green" />Sales</div>
        </article>

        <article className="card chart-side">
          <h4>Top Products</h4>
          <ul>
            {(topProducts.length ? topProducts : ["No data"]).map((name, idx) => (
              <li key={`${name}-${idx}`}>
                {name}
                <span className={isStats ? "rating" : ""}>{isStats ? "*****" : ""}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </AppShell>
  );
}

export default DashboardPage;
