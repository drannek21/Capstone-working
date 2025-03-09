import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css"; // ✅ Import CSS Module

const Login = () => {
  const navigate = useNavigate(); // For redirection
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superadmins, setSuperadmins] = useState([]);
  const [loading, setLoading] = useState(true); // For loading state

  // Fetch the data when the component mounts
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8081/users"),
      fetch("http://localhost:8081/admin"),
      fetch("http://localhost:8081/superadmin"),
    ])
      .then(([usersRes, adminsRes, superadminsRes]) =>
        Promise.all([usersRes.json(), adminsRes.json(), superadminsRes.json()])
      )
      .then(([usersData, adminsData, superadminsData]) => {
        setUsers(usersData);
        setAdmins(adminsData);
        setSuperadmins(superadminsData);
        setLoading(false); // Set loading to false once data is fetched
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false); // Set loading to false even if there's an error
      });
  }, []);

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
  
    // Check if entered email & password match any user in users, admins, or superadmins
    const foundUser =
      users.find((user) => user.email === email && user.password === password) ||
      admins.find((admin) => admin.email === email && admin.password === password) ||
      superadmins.find(
        (superadmin) => superadmin.email === email && superadmin.password === password
      );
  
    if (foundUser) {
      // Store user data in localStorage
      localStorage.setItem("loggedInUser", JSON.stringify(foundUser)); // Store the full user object
      localStorage.setItem("UserId", foundUser.id); // Store only the UserId
  
      // Redirect based on role
      if (foundUser.role === "admin") {
        navigate("/admin-dashboard"); // Admin goes to Admin Dashboard
      } else if (foundUser.role === "superadmin") {
        navigate("/superadmin-dashboard"); // Superadmin goes to Superadmin Dashboard
      } else {
        navigate("/userui"); // Regular user goes to Homepage
      }
    } else {
      setError("Invalid email or password. Please try again.");
    }
  };
  
  // Show loading message until data is fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-box"]}>
        <h2>Login</h2>
        {error && <p className={styles["error-message"]}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div className={styles["input-group"]}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles["input-group"]}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles["forgot-password"]}>
            <button type="button" className={styles["forgot-password-btn"]} onClick={() => { /* Handle forgot password action */ }}>
              Forgot Password?
            </button>
          </div>
          <button type="submit" className={styles["login-btn"]}>
            Login
          </button>
        </form>
        <p className={styles["signup-text"]}>
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
