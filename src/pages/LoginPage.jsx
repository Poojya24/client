import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authStore } from "../services/api";

function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const user = isSignUp
        ? await api.register({ firstName, lastName, name: `${firstName} ${lastName}`.trim(), email, password })
        : await api.login({ email, password });

      authStore.setSession(user);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || (isSignUp ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
  if (!email) {
    setError("Enter your email first");
    return;
  }

  try {
    const res = await api.forgotPassword({ email });

    console.log("OTP:", res.otp); // 🔥 DEBUG

    // store for next page
    localStorage.setItem("resetEmail", email);
    localStorage.setItem("resetOTP", res.otp);

    navigate("/otp"); // 🔥 GO TO OTP PAGE

  } catch (err) {
    setError(err.message || "Unable to send OTP");
  }
};

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>{isSignUp ? "Create your account" : "Log in to your account"}</h2>
        <p>{isSignUp ? "Sign up to start managing inventory." : "Welcome back! Please enter your details."}</p>

        <form onSubmit={onSubmit}>
          {isSignUp ? (
            <>
              <label>First Name</label>
              <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />

              <label>Last Name</label>
              <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </>
          ) : null}

          <label>Email</label>
          <input type="email" placeholder="Example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password</label>
          <div className="password-wrap">
            <input type="password" placeholder="at least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <span className="eye-icon">o</span>
          </div>

          {!isSignUp ? (
            <button type="button" className="link-button" onClick={onForgot}>
              Forgot Password?
            </button>
          ) : null}

          <button type="submit" className="primary-btn full" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
          </button>
        </form>

        {error ? <p className="api-error">{error}</p> : null}
        {info ? <p className="api-info">{info}</p> : null}

        <div className="login-footer-text">
          {isSignUp ? "Already have an account? " : "Don't you have an account? "}
          <button type="button" className="switch-auth-btn" onClick={() => setIsSignUp((prev) => !prev)}>
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>
      </section>

      <section className="login-hero">
        <div className="hero-badge" />
        <h1>Welcome to<br />Company Name</h1>
        <img src="/designs/Concept of data analysis and maintenance.png" alt="analytics illustration" />
      </section>
    </main>
  );
}

export default LoginPage;
