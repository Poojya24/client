import { useState } from "react";
import { useNavigate } from "react-router-dom";

function OtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    const savedOTP = localStorage.getItem("resetOTP");

    if (otp === savedOTP) {
      navigate("/reset-password");
    } else {
      alert("Invalid OTP");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>Enter Your OTP</h2>
        <p>
          We’ve sent a 6-digit OTP to your registered mail.
          Please enter it below to sign in.
        </p>

        <label>OTP</label>
        <input
          type="text"
          placeholder="xxxx05"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button className="primary-btn full" onClick={handleVerify}>
          Confirm
        </button>
      </section>

      <section className="login-hero">
        <div className="hero-badge" />
        <img src="/designs/rocket.png" alt="otp illustration" />
      </section>
    </main>
  );
}

export default OtpPage;