import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import FaceAuth from "./FaceAuth";

// Define the FaceAuthModal component outside the main component to prevent re-rendering
const FaceAuthModal = ({ 
  modalEmail, 
  modalError, 
  checkingUser, 
  handleModalEmailChange, 
  closeModal, 
  verifyUserForFaceAuth 
}) => (
  <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <h3>Face Recognition Login</h3>
      <p>Please enter your email to proceed with face recognition login</p>
      
      {modalError && <p className={styles.errorMessage}>{modalError}</p>}
      
      <div className={styles.inputGroup}>
        <label htmlFor="modalEmail">Email</label>
        <input
          id="modalEmail"
          type="email"
          value={modalEmail}
          onChange={handleModalEmailChange}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className={styles.modalButtons}>
        <button 
          type="button" 
          className={styles.cancelBtn}
          onClick={closeModal}
          disabled={checkingUser}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className={styles.proceedBtn}
          onClick={verifyUserForFaceAuth}
          disabled={checkingUser}
        >
          {checkingUser ? "Checking..." : "Proceed"}
        </button>
      </div>
    </div>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [faceAuthError, setFaceAuthError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalError, setModalError] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);

  useEffect(() => {
    // Load saved credentials if rememberMe is true
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials);
      setFormData({ email, password });
      setRememberMe(true);
    }
  }, []);

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

        // Save credentials if rememberMe is checked
        if (rememberMe) {
          localStorage.setItem('savedCredentials', JSON.stringify(formData));
        } else {
          localStorage.removeItem('savedCredentials');
        }

        navigateToDashboard(user.role);
      } else if (response.status === 403 && data.error === 'Account is pending approval') {
        // Handle pending account status
        setError(
          <div className={styles.pendingMessage}>
            <p><strong>Your application is currently being reviewed by our administrators.</strong></p>
          </div>
        );
        localStorage.removeItem('savedCredentials');
      } else {
        setError(data.error || "Login failed. Please try again.");
        localStorage.removeItem('savedCredentials');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server. Please try again later.");
      localStorage.removeItem('savedCredentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceAuthSuccess = (user) => {
    try {
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      localStorage.setItem("UserId", user.id);
      
      // For backward compatibility with older code
      if (user.role) {
        localStorage.setItem("id", user.id);
        localStorage.setItem("barangay", user.barangay || "");
      }

      // Determine user role - in case the face auth endpoint doesn't return role
      const role = user.role || "user";
      navigateToDashboard(role);
    } catch (err) {
      console.error("Error during face auth login:", err);
      setFaceAuthError("Error completing face authentication login. Please try again.");
      setShowFaceAuth(false);
    }
  };

  const navigateToDashboard = (role) => {
    switch (role) {
      case "admin":
        navigate("/admin-dashboard");
        break;
      case "superadmin":
        navigate("/superadmin/sdashboard");
        break;
      default:
        navigate("/userui");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const openFaceAuthModal = () => {
    setModalEmail("");
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalEmail("");
    setModalError("");
  };

  const handleModalEmailChange = (e) => {
    setModalEmail(e.target.value);
    setModalError("");
  };

  const verifyUserForFaceAuth = async () => {
    if (!modalEmail) {
      setModalError("Please enter your email address");
      return;
    }
    
    console.log("Email entered in modal:", modalEmail);
    // Store the email in localStorage temporarily to ensure it's available
    localStorage.setItem('faceAuthEmail', modalEmail);
    setCheckingUser(true);
    setModalError("");
    
    try {
      console.log("Checking user status for email:", modalEmail);
      const response = await fetch("http://localhost:8081/api/check-user-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: modalEmail }),
      });

      // Log response details for debugging
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        if (response.status === 404) {
          setModalError("Email not found. Please check your email or register a new account.");
          setCheckingUser(false);
          return;
        }
        
        const text = await response.text();
        console.error(`Server responded with status ${response.status}:`, text);
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        if (data.user.status === "Verified") {
          // Check if user has face recognition photo
          if (!data.user.hasFaceRecognition) {
            setModalError("You don't have a registered face. Please register your face first or login with email and password.");
          } else {
            // Proceed to face auth
            console.log("Proceeding to face auth with email:", modalEmail);
            closeModal();
            setShowFaceAuth(true);
          }
        } else {
          setModalError("Your account is not verified. Please verify your account before using face recognition.");
        }
      } else {
        setModalError(data.error || "Email not found. Please check your email or register a new account.");
      }
    } catch (err) {
      console.error("Error checking user:", err);
      setModalError("Email not found. Please check your email or register a new account.");
    } finally {
      setCheckingUser(false);
    }
  };

  if (showFaceAuth) {
    console.log("Rendering FaceAuth component with email:", modalEmail);
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <button 
            className={styles.backButton}
            onClick={() => {
              setShowFaceAuth(false);
              setFaceAuthError("");
            }}
          >
            ← Back to Login
          </button>
          {faceAuthError && <p className={styles.errorMessage}>{faceAuthError}</p>}
          <FaceAuth 
            onLoginSuccess={handleFaceAuthSuccess} 
            email={modalEmail}
          />
        </div>
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
          
          <div className={styles.rememberMe}>
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          </div>
          
          <div className={styles.forgotPassword}>
            <button 
              type="button"
              className={styles.forgotPasswordBtn}
              onClick={() => navigate('/forgot-password')}
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

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <button
            type="button"
            className={styles.faceAuthBtn}
            onClick={openFaceAuthModal}
          >
            Login with Face Recognition
          </button>
        </form>
        
        <p className={styles.signupText}>
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
      
      {showModal && (
        <FaceAuthModal
          modalEmail={modalEmail}
          modalError={modalError}
          checkingUser={checkingUser}
          handleModalEmailChange={handleModalEmailChange}
          closeModal={closeModal}
          verifyUserForFaceAuth={verifyUserForFaceAuth}
        />
      )}
    </div>
  );
};

export default Login;
