import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleReset = async () => {
    const email = localStorage.getItem("resetEmail");

    try {
      await api.resetPassword({ email, password });
      alert("Password updated!");
      navigate("/");
    } catch (err) {
      alert("Error resetting password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Create New Password</h2>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleReset} className="primary-btn full">
          Reset Password
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;