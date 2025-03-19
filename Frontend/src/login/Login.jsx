import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8081/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const { user } = data;
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        localStorage.setItem("UserId", user.id);
        
        // Store admin ID and barangay if the user is an admin
        if (user.role === "admin") {
          localStorage.setItem("id", user.id);
          localStorage.setItem("barangay", user.barangay);
        }

        switch (user.role) {
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "superadmin":
            navigate("/superadmin/sdashboard");
            break;
          default:
            navigate("/userui");
        }
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>Login</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordContainer}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                data-visible={showPassword}
              >
              </button>
            </div>
          </div>
          
          <div className={styles.forgotPassword}>
            <button 
              type="button" 
              className={styles.forgotPasswordBtn} 
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>
          
          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p className={styles.signupText}>
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
