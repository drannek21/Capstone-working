import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Signup.module.css"; // ✅ Import the CSS module

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "", // Added name field
  });

  const [error, setError] = useState(""); // ✅ State for error message
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const navigate = useNavigate(); // ✅ Navigation hook

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // ✅ Clear error message when user types
    if (e.target.name === "confirmPassword") {
      setError("");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true); // Set loading to true while submitting

    try {
      // Sending the POST request to create a new user
      const response = await fetch("http://localhost:8081/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Ensures the request body is in JSON format
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name, // Send the name along with the rest of the data
          role: "user",
          status: "Unverified" // Default role for new users
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        console.log("Account Created:", data);
        navigate("/login"); // Redirect to login page after successful signup
      } else {
        setError(data.error || "An error occurred during account creation.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false); // Set loading to false after submitting
    }
  };

  return (
    <div className={styles["signup-container"]}>
      <div className={styles["signup-box"]}>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles["input-group"]}>
            <label>Name</label> {/* Added name input */}
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              required
              onChange={handleChange}
            />
          </div>
          <div className={styles["input-group"]}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              onChange={handleChange}
            />
          </div>
          <div className={styles["input-group"]}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              required
              onChange={handleChange}
            />
          </div>
          <div className={styles["input-group"]}>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              required
              onChange={handleChange}
            />
          </div>
          {error && <p className={styles["error-message"]}>{error}</p>} {/* ✅ Display error if passwords don't match */}
          <button
            type="submit"
            disabled={loading || error}
            className={styles["signup-btn"]}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className={styles["login-text"]}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
