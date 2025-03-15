import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Signup.module.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    barangay: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const barangayList = [
    "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5",
    "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10",
    "Barangay 11", "Barangay 12", "Barangay 13", "Barangay 14", "Barangay 15",
    "Barangay 16", "Barangay 17", "Barangay 18", "Barangay 19", "Barangay 20",
    "Barangay 21", "Barangay 22", "Barangay 23", "Barangay 24", "Barangay 25"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "confirmPassword") {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8081/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          barangay: formData.barangay,
          role: "user",
          status: "Unverified"
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        console.log("Account Created:", data);
        navigate("/login");
      } else {
        setError(data.error || "An error occurred during account creation.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="barangay">Select Barangay</label>
            <select
              id="barangay"
              name="barangay"
              value={formData.barangay}
              onChange={handleChange}
              required
              className={styles.dropdown}
            >
              <option value="" disabled>Select your Barangay</option>
              {barangayList.map((barangay, index) => (
                <option key={index} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.passwordContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={styles.signupBtn}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className={styles.loginText}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
