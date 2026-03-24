const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const readToken = () => localStorage.getItem("token") || "";

async function request(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const finalHeaders = { ...headers };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
  }

  if (auth) {
    const token = readToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  register: (payload) => request("/users/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/users/login", { method: "POST", body: payload, auth: false }),
  forgotPassword: (payload) => request("/users/forgot-password", { method: "POST", body: payload, auth: false }),
  getProfile: () => request("/users/profile"),
  updateProfile: (payload) => request("/users/profile", { method: "PUT", body: payload }),
  updateLayout: (layout) => request("/users/layout", { method: "PUT", body: { layout } }),

  getSummaryStats: () => request("/stats/summary"),
  getGraphData: () => request("/stats/graph"),
  getTopSelling: () => request("/stats/top-selling"),

  getInventorySummary: () => request("/products/summary"),
  getProducts: (page = 1, keyword = "") =>
    request(`/products?pageNumber=${page}&pageSize=10${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""}`),
  createProduct: (payload) => request("/products", { method: "POST", body: payload }),
  uploadProductImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return request("/products/image-upload", { method: "POST", body: fd });
  },
  uploadProductsCsv: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("/products/upload", { method: "POST", body: fd });
  },
  buyProduct: (id, quantity) => request(`/products/${id}/buy`, { method: "POST", body: { quantity } }),

  getInvoices: (page = 1, keyword = "") =>
    request(`/invoices?pageNumber=${page}&pageSize=10${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""}`),
  getInvoiceStats: () => request("/invoices/stats"),
  getInvoiceById: (id) => request(`/invoices/${id}`),
  updateInvoiceStatus: (id, status) => request(`/invoices/${id}/status`, { method: "PUT", body: { status } }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: "DELETE" }),
};

export const authStore = {
  getToken: () => readToken(),
  setSession: (user) => {
    if (user?.token) {
      localStorage.setItem("token", user.token);
    }
    localStorage.setItem("user", JSON.stringify(user || {}));
  },
  clear: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  getUser: () => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
