import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [userData, setUserData] = useState({
    users: [],
    admins: [],
    superadmins: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllUserData = async () => {
      try {
        const [usersRes, adminsRes, superadminsRes] = await Promise.all([
          fetch("http://localhost:8081/users"),
          fetch("http://localhost:8081/admin"),
          fetch("http://localhost:8081/superadmin"),
        ]);

        const [users, admins, superadmins] = await Promise.all([
          usersRes.json(),
          adminsRes.json(),
          superadminsRes.json(),
        ]);

        setUserData({
          users,
          admins,
          superadmins
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    
    const { email, password } = formData;
    const { users, admins, superadmins } = userData;

    // Check all user types for matching credentials
    const foundUser = [
      ...users,
      ...admins,
      ...superadmins
    ].find(user => user.email === email && user.password === password);
    
    if (foundUser) {
      // Store user data in localStorage
      localStorage.setItem("loggedInUser", JSON.stringify(foundUser));
      localStorage.setItem("UserId", foundUser.id);
      
      // Navigate based on user role
      switch (foundUser.role) {
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
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleForgotPassword = () => {
    // Implement forgot password functionality
    navigate("/forgot-password");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading, please wait...</p>
      </div>
    );
  }

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
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
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
          
          <button type="submit" className={styles.loginBtn}>
            Login
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