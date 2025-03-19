import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; // Import CSS file
import { FaCamera, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa"; // Import icons
import avatar from "../assets/avatar.jpg";
import html2canvas from 'html2canvas';
import dswdLogo from '../assets/dswd-logo.png';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("Details");
  const [user, setUser] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loggedInUserId = localStorage.getItem("UserId");

  // Update these constants at the top of your component
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';  // Make sure this matches your Cloudinary upload preset
  const CLOUDINARY_FOLDER = 'Profile_Pics';


  // Fetch user details and check for status changes
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        console.error("No logged-in user found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:8081/getUserDetails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
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
          
          // Check if profilePic exists in the response
          if (data.profilePic) {
            localStorage.setItem(`profilePic_${loggedInUserId}`, data.profilePic);
          } else {
            const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
            if (cachedProfilePic) {
              data.profilePic = cachedProfilePic;
            }
          }
          
          setUser(data);
        } else {
          console.error("Error fetching user data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [loggedInUserId]);

  // Check expiration only once when user data is loaded
  useEffect(() => {
    if (user && isIDExpired() && user.status !== "Renewal") {
      updateUserStatusToRenewal();
    }
  }, [user?.status]); // Only run when status changes

  const renderUserDetails = () => {
    if (!user) return null;
    
    if (user.status === "Verified") {
      return (
        <div className="user-details">
          <h3>Personal Information</h3>
          <ul>
            <li>
              <span className="label">Gender</span>
              <span className="value">{user.gender}</span>
            </li>
            <li>
              <span className="label">Birthdate</span>
              <span className="value">{user.date_of_birth ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.date_of_birth)) : ''}</span>
            </li>
            <li>
              <span className="label">Place of Birth</span>
              <span className="value">{user.place_of_birth}</span>
            </li>
            <li>
              <span className="label">Address</span>
              <span className="value">{user.address}</span>
            </li>
            <li>
              <span className="label">Religion</span>
              <span className="value">{user.religion}</span>
            </li>
            <li>
              <span className="label">Civil Status</span>
              <span className="value">{user.civil_status}</span>
            </li>
            <li>
              <span className="label">Company</span>
              <span className="value">{user.company}</span>
            </li>
            <li>
              <span className="label">Monthly Income</span>
              <span className="value">₱ {user.income}</span>
            </li>
            <li>
              <span className="label">Contact Number</span>
              <span className="value">{user.contact_number}</span>
            </li>
            <li>
              <span className="label family">Family Composition</span>
              {user.children && user.children.length > 0 ? (
                <ul className="children-list">
                  {user.children.map((child, index) => (
                    <li key={index}>
                      <strong>Child {index + 1}: {child.first_name} {child.middle_name} {child.last_name}</strong>
                      <div className="child-details">
                        {child.birthdate && (
                          <span>Born: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(child.birthdate))}</span>
                        )}
                        {child.age && <span>Age: {child.age}</span>}
                        {child.educational_attainment && <span>Education: {child.educational_attainment}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="no-children">No children registered</span>
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
    } else if (user.status === "Renewal") {
      return (
        <div className="verification-prompt">
          <h3>Renewal Application Under Review</h3>
          <p>Your renewal application is currently being processed. Please wait for the admin's response.</p>
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

  // Remove this unused function
  // const handleBirthdateChange = (e) => {
  //   const birthdate = e.target.value;
  //   setUser(prev => ({...prev, date_of_birth: birthdate}));
  // };

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

  // Handle the profile picture upload to Cloudinary
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', CLOUDINARY_FOLDER);

      // First, upload to Cloudinary
      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const imageUrl = cloudinaryData.secure_url;

      // Then, update the backend
      const backendResponse = await fetch("http://localhost:8081/updateUserProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: loggedInUserId, 
          profilePic: imageUrl 
        }),
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to update profile in backend');
      }

      // Update local state and storage
      localStorage.setItem(`profilePic_${loggedInUserId}`, imageUrl);
      setUser(prev => ({
        ...prev,
        profilePic: imageUrl
      }));

      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle application submission for verification
  const handleSendApplication = () => {
    navigate("/form", { state: { userId: loggedInUserId } }); // Navigate to the form page
  };

  // Add this function after the other handler functions and before the render checks
  const downloadID = async () => {
    const idCard = document.getElementById('idCard');
    if (!idCard) return;
  
    try {
      // Wait for images to load
      const images = idCard.getElementsByTagName('img');
      await Promise.all([...images].map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
  
      const canvas = await html2canvas(idCard, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher quality
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${user.name}_SoloParent_ID.png`;
      link.click();
    } catch (error) {
      console.error('Error generating ID:', error);
      alert('Failed to download ID. Please try again.');
    }
  };

  // Add this function to check if ID is expired
  const isIDExpired = () => {
    if (!user.validUntil) return false;
    const expirationDate = new Date(user.validUntil);
    const today = new Date('2026-03-14');
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    return expirationDate <= today;
  };

  // Add this function to update user status to Renewal
  const updateUserStatusToRenewal = async () => {
    try {
      const response = await fetch("http://localhost:8081/updateUserStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: loggedInUserId,
          status: "Renewal"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      setUser(prev => ({
        ...prev,
        status: "Renewal"
      }));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Add this function to handle renewal application
  const handleRenewalApplication = () => {
    navigate("/form", { 
      state: { 
        userId: loggedInUserId,
        isRenewal: true 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-container">
        <p>Unable to load profile. Please log in again.</p>
        <button className="login-button" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  const status = user.status || "Unverified";
  const statusIcon = {
    Verified: <FaCheckCircle className="status-icon verified" />,
    Pending: <FaClock className="status-icon pending" />,
    Unverified: <FaTimes className="status-icon unverified" />,
  };

  // Get the profile picture URL from user object or localStorage
  // Update the profile picture URL determination
  const profilePicUrl = user?.profilePic || avatar;
  
  // Modify this function to prevent constant refreshing
  const getImageUrl = (url) => {
    if (url === avatar) return url;
    // Only add timestamp when the URL is first created
    if (!url.includes('?')) {
      return `${url}?${new Date().getTime()}`;
    }
    return url;
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture-container">
          <img 
            src={getImageUrl(profilePicUrl)} 
            alt="Profile" 
            className="profile-pic" 
            onError={(e) => {
              console.log("Image failed to load, using avatar");
              e.target.onerror = null;
              e.target.src = avatar;
            }}
          />
          <button className="upload-button" onClick={() => setShowUploadModal(true)}>
            <FaCamera />
          </button>
        </div>
        <div className="profile-info">
          <h1>{user.name || "User"}</h1>
          <p className="email">{user.email || "No email"}</p>
          <div className="status-badge">
            {statusIcon[status] || statusIcon.Unverified}
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
              {status === "Verified" ? (
                <div className="id-container">
                  <div id="idCard" className="digital-id">
                    {/* Front of ID */}
                    <div className="id-front">
                      <div className="id-header">
                        <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                        <div className="id-title">
                          <h2>SOLO PARENT IDENTIFICATION CARD</h2>
                          <p>Republic of the Philippines</p>
                          <p className="id-subtitle">DSWD Region III</p>
                        </div>
                      </div>
                      <div className="id-body">
                        <div className="id-photo-container">
                          <div className="id-photo">
                            <img 
                              src={getImageUrl(profilePicUrl)} 
                              alt="User" 
                              crossOrigin="anonymous" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = avatar;
                              }}
                            />
                          </div>
                          <div className="id-validity">
                            <strong>Category: </strong>
                            <span>{user.classification}</span>
                          </div>
                         
                          <div className={`id-validity ${isIDExpired() ? "expired" : ""}`}>
                            <strong>Valid Until: </strong>
                            {user.validUntil ? new Date(user.validUntil).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="id-details">
                          <div className="detail-row">
                            <strong>ID No:</strong>
                            <span>{String(user.code_id).padStart(6, '0')}</span>
                          </div>
                          <div className="detail-row">
                            <strong>Name:</strong>
                            <span>{user.name}</span>
                          </div>
                          <div className="detail-row">
                            <strong>Address:</strong>
                            <span>{user.address}</span>
                          </div>
                          <div className="detail-row">
                            <strong>Birthdate:</strong>
                            <span>{user.date_of_birth ? 
                              new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
                              .format(new Date(user.date_of_birth)) : ''}</span>
                          </div>
                          <div className="detail-row">
                            <strong>Civil Status:</strong>
                            <span>{user.civil_status}</span>
                          </div>
                          <div className="detail-row">
                            <strong>Contact:</strong>
                            <span>{user.contact_number}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Back of ID */}
                    <div className="id-back">
                      <h3>Children Information</h3>
                      {user.children && user.children.length > 0 ? (
                        <table className="children-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Age</th>
                              <th>Education</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.children.map((child, index) => (
                              <tr key={index}>
                                <td>{`${child.first_name} ${child.middle_name} ${child.last_name}`}</td>
                                <td>{child.age}</td>
                                <td>{child.educational_attainment}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-children-text">No registered children</p>
                      )}
                      <div className="id-footer">
                        <p>Date Issued: {user.accepted_at ? new Date(user.accepted_at).toLocaleDateString() : 'N/A'}</p>
                        <p>Valid Until: {user.validUntil ? new Date(user.validUntil).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <button className="download-id-btn" onClick={downloadID}>
                    Download ID Card
                  </button>
                </div>
              ) : status === "pending" ? (
                <div className="verification-prompt">
                  <h3>ID is being processed</h3>
                  <p>Please wait while your application is under review.</p>
                </div>
              ) : status === "Renewal" ? (
                <div className="verification-prompt">
                  <h3>Renewal Application Under Review</h3>
                  <p>Please wait while your renewal application is being processed.</p>
                </div>
              ) : (
                <div className="verification-prompt">
                  <h3>ID Not Available</h3>
                  <p>Complete verification to get your digital ID.</p>
                  <button className="verify-button" onClick={handleSendApplication}>
                    Start Verification
                  </button>
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
                src={previewUrl || profilePicUrl}
                alt="Preview"
                className="preview-image"
                onError={(e) => {
                  e.target.src = avatar;
                }}
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
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? "Uploading..." : "Save Photo"}
              </button>
              <button
                className="cancel-btn-user"
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