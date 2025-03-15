import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; // Import CSS file
import { FaCamera, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa"; // Import icons
import avatar from "../assets/avatar.jpg";
import idPic from "../assets/idpic.png";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("Details"); // Track active tab
  const [user, setUser] = useState(null); // Store user details
  const [showUploadModal, setShowUploadModal] = useState(false); // Modal visibility for upload
  const [selectedFile, setSelectedFile] = useState(null); // File to be uploaded
  const [previewUrl, setPreviewUrl] = useState(null); // Preview image URL
  const [previousStatus, setPreviousStatus] = useState(null);
  const navigate = useNavigate(); // Use navigate for navigation

  const loggedInUserId = localStorage.getItem("UserId"); // Get the logged-in user ID

  // Fetch user details and check for status changes
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        console.error("No logged-in user found");
        return;
      }

      try {
        const response = await fetch("http://localhost:8081/getUserDetails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }), // Pass the userId to fetch data
        });

        const data = await response.json();

        if (response.ok) {
          // Check if status has changed
          if (previousStatus && previousStatus !== data.status) {
            // Show notification based on new status
            if (data.status === "Verified") {
              alert("Congratulations! Your application has been approved!");
            } else if (data.status === "Unverified" && previousStatus === "Pending") {
              alert("Your application has been declined. Please check with the admin for more details.");
            }
          }
          setPreviousStatus(data.status);
          setUser(data); // Set the user data
        } else {
          console.error("Error fetching user data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserDetails();
    // Check for updates every 30 seconds
    const interval = setInterval(fetchUserDetails, 30000);
    return () => clearInterval(interval);
  }, [loggedInUserId, previousStatus]);

  const renderUserDetails = () => {
    if (user.status === "Verified") {
      return (
        <div className="user-details">
          <h3>Personal Information</h3>
          <ul>
            <li>Gender: {user.gender}</li>
            <li>Birthdate: {user.date_of_birth ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.date_of_birth)) : ''}</li>
            <li>Place of Birth: {user.place_of_birth}</li>
            <li>Address: {user.address}</li>
            <li>Religion: {user.religion}</li>
            <li>Civil Status: {user.civil_status}</li>
            <li>Company: {user.company}</li>
            <li>Monthly Income: ₱ {user.income}</li>
            <li>Contact Number: {user.contact_number}</li>
            <li>
              Family Composition:
              {user.children && user.children.length > 0 ? (
                <ul className="children-list">
                  {user.children.map((child, index) => (
                    <li key={index}>
                      <strong>Child {index + 1}:</strong>{' '}
                      {child.first_name} {child.middle_name} {child.last_name}
                      {child.birthdate && (
                        <span> - Born: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(child.birthdate))}</span>
                      )}
                      {child.age && <span> - Age: {child.age}</span>}
                      {child.educational_attainment && <span> - Education: {child.educational_attainment}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span> No children registered</span>
              )}
            </li>
          </ul>
        </div>
      );
    } else if (user.status === "pending") {
      return (
        <div className="verification-prompt">
          <h3>Application Under Review</h3>
          <p>Your verification application is currently being reviewed. Please wait for the admin's response.</p>
        </div>
      );
    } else {
      return (
        <div className="verification-prompt">
          <h3>Verify Your Account</h3>
          <p>Complete your verification to access all features and benefits.</p>
          <button className="verify-button" onClick={handleSendApplication}>
            Start Verification
          </button>
        </div>
      );
    }
  };

  const handleBirthdateChange = (e) => {
    const birthdate = e.target.value;
    setUser(prev => ({...prev, date_of_birth: birthdate}));
  };

  // Handle file change when a user selects a file to upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result); // Preview the image
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger the file input click event
  const handleUploadClick = () => {
    document.getElementById("profilePicInput").click();
  };

  // Handle the profile picture upload to the backend
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("profilePic", selectedFile);
    formData.append("userId", loggedInUserId);

    try {
      const response = await fetch("http://localhost:8081/uploadProfilePic", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const updatedUser = { ...user, profilePic: URL.createObjectURL(selectedFile) };
        setUser(updatedUser); // Update the profile picture after upload
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    }
  };

  // Handle application submission for verification
  const handleSendApplication = () => {
    navigate("/form", { state: { userId: loggedInUserId } }); // Navigate to the form page
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const status = user.status || "Unverified";
  const statusIcon = {
    Verified: <FaCheckCircle className="status-icon verified" />,
    Pending: <FaClock className="status-icon pending" />,
    Unverified: <FaTimes className="status-icon unverified" />,
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture-container">
          <img src={user.profilePic || avatar} alt="Profile" className="profile-pic" />
          <button className="upload-button" onClick={() => setShowUploadModal(true)}>
            <FaCamera />
          </button>
        </div>
        <div className="profile-info">
          <h1>{user.name || "Unverified"}</h1>
          <p className="email">{user.email || "Unverified"}</p>
          <div className="status-badge">
            {statusIcon[status]}
            <span>{status}</span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="tab-navigation">
          {["Details", "ID"].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "Details" && renderUserDetails()}

          {activeTab === "ID" && (
            <div className="id-tab">
              {status === "Unverified" ? (
                <div className="verification-prompt">
                  <h3>ID Not Available</h3>
                  <p>Complete verification to get your digital ID.</p>
                  <button className="verify-button" onClick={handleSendApplication}>
                    Start Verification
                  </button>
                </div>
              ) : (
                <div className="id-card">
                  {user.idPic ? (
                    <img src={user.idPic} alt="ID" className="id-image" />
                  ) : (
                    <div className="no-id">
                      <p>ID is being processed</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Profile Picture</h3>
            <div className="preview-container">
              <img
                src={previewUrl || user.profilePic || avatar}
                alt="Preview"
                className="preview-image"
              />
            </div>
            <input
              type="file"
              id="profilePicInput"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div className="modal-buttons">
              <button className="upload-photo-btn" onClick={handleUploadClick}>
                Choose Photo
              </button>
              <button
                className="save-photo-btn"
                onClick={handleUploadSubmit}
                disabled={!selectedFile}
              >
                Save Photo
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
