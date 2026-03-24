import { NavLink } from "react-router-dom";
import { authStore } from "../services/api";

const navItems = [
  { label: "Home", to: "/home" },
  { label: "Products", to: "/products" },
  { label: "Invoices", to: "/invoice" },
  { label: "Statistics", to: "/statistics" },
  { label: "Settings", to: "/settings" }
];

function AppShell({ title, children, showSearch = true, blurred = false, onSearch, searchValue = "" }) {
  const user = authStore.getUser();
  const displayName = user?.firstName || user?.name || "User";

  return (
    <div className={`app-shell ${blurred ? "is-blurred" : ""}`}>
      <aside className="sidebar">
        <div className="brand-mark" />
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar-dot" />
          <span>{displayName}</span>
        </div>
      </aside>

      <section className="panel-area">
        <header className="top-strip">
          <h1>{title}</h1>
          {showSearch ? (
            <div className="search-pill">
              <span className="search-icon">Q</span>
              <input
                type="text"
                placeholder="Search here..."
                value={searchValue}
                onChange={(e) => onSearch && onSearch(e.target.value)}
              />
            </div>
          ) : null}
        </header>
        <div className="page-body">{children}</div>
      </section>
    </div>
  );
}

export default AppShell;
