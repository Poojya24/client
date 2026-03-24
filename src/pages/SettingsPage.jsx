import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { api, authStore } from "../services/api";

function SettingsPage() {
  useAuthGuard();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.getProfile();
        setForm((prev) => ({ ...prev, firstName: profile.firstName || "", lastName: profile.lastName || "", email: profile.email || "" }));
      } catch (err) {
        if ((err.message || "").toLowerCase().includes("token") || (err.message || "").includes("401")) {
          authStore.clear();
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message || "Failed to load profile");
      }
    };

    load();
  }, [navigate]);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
      };

      if (form.password) {
        payload.password = form.password;
      }

      const updated = await api.updateProfile(payload);
      authStore.setSession(updated);
      setMessage("Profile updated");
      setError("");
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setError(err.message || "Update failed");
      setMessage("");
    }
  };

  return (
    <AppShell title="Settings" active="Settings" showSearch={false}>
      <section className="card settings-card">
        <h3>Edit Profile</h3>
        {error ? <p className="api-error">{error}</p> : null}
        {message ? <p className="api-info">{message}</p> : null}
        <div className="settings-fields">
          <label>First name<input value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} /></label>
          <label>Last name<input value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} /></label>
          <label>Email<input value={form.email} disabled className="disabled-input" /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} /></label>
          <label>Confirm Password<input type="password" value={form.confirmPassword} onChange={(e) => onChange("confirmPassword", e.target.value)} /></label>
        </div>
        <div className="settings-actions"><button type="button" className="primary-btn" onClick={onSave}>Save</button></div>
      </section>
    </AppShell>
  );
}

export default SettingsPage;
