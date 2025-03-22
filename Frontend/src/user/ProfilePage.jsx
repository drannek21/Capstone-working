import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; // Import CSS file
import { FaCamera, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa"; // Import icons
import avatar from "../assets/avatar.jpg";
import html2canvas from 'html2canvas';
import dswdLogo from '../assets/dswd-logo.png';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("Details");
  const [user, setUser] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState({
    psa: null,
    itr: null,
    medical: null,
    marriage: null,
    death: null,
    cenomar: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const navigate = useNavigate();

  const loggedInUserId = localStorage.getItem("UserId");

  // Update these constants at the top of your component
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';  // Make sure this matches your Cloudinary upload preset
  const CLOUDINARY_FOLDER = 'Profile_Pics';

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

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
        const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
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
            } else if (data.status === "Terminated") {
              alert("Your Solo Parent application has been terminated. Please contact your Barangay for more information.");
            } else if (data.status === "Pending Remarks") {
              alert("Your application is under investigation. Please wait for the admin's response.");
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
  }, [loggedInUserId, navigate]);

  // Check expiration only once when user data is loaded
  useEffect(() => {
    if (user && isIDExpired() && user.status !== "Renewal") {
      updateUserStatusToRenewal();
    }
  }, [user?.status]); // Only run when status changes

  const renderUserDetails = () => {
    if (!user) return null;
    
    if (user.status === "Terminated") {
      return (
        <div className="verification-prompt terminated">
          <h3>Account Terminated</h3>
          <p>We regret to inform you that your Solo Parent application has been terminated.</p>
          <p>If you believe this is a mistake or would like to appeal this decision, please contact your Barangay office for assistance.</p>
          <p>You may need to provide additional documentation or information to support your case.</p>
        </div>
      );
    } else if (user.status === "Pending Remarks") {
      return (
        <div className="verification-prompt">
          <h3>Application Under Investigation</h3>
          <p>Sorry, your application is currently under investigation by the admin. Please wait for further updates.</p>
        </div>
      );
    } else if (user.status === "Verified") {
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
              <span className="label">Barangay</span>
              <span className="value">{user.barangay}</span>
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
              <span className="value">{user.income}</span>
            </li>
            <li>
              <span className="label">Contact Number</span>
              <span className="value">{user.contact_number}</span>
            </li>
            <li>
              <span className="label family">Family Composition</span>
              {user.familyMembers && user.familyMembers.length > 0 ? (
                <ul className="children-list">
                  {user.familyMembers
                    .filter(member => member.relationship === 'Child')
                    .map((child, index) => (
                      <li key={index}>
                        <strong>Child {index + 1}: {child.name}</strong>
                        <div className="child-details">
                          <span>Age: {child.age}</span>
                          <span>Education: {child.educational_attainment}</span>
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
  const handleUploadClick = (type) => {
    const fileInput = document.getElementById(`file-input-${type}`);
    if (fileInput) {
      fileInput.click();
    }
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
      const backendResponse = await fetch(`${API_BASE_URL}/updateUserProfile`, {
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
  
      // Create a temporary container to hold the ID card at full size
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '0';
      tempContainer.style.left = '0';
      tempContainer.style.width = '750px';
      tempContainer.style.height = '1500px';
      tempContainer.style.transform = 'scale(1)';
      tempContainer.style.transformOrigin = 'top left';
      tempContainer.style.zIndex = '9999';
      tempContainer.style.pointerEvents = 'none';
      
      // Clone the ID card and append it to the temporary container
      const idCardClone = idCard.cloneNode(true);
      tempContainer.appendChild(idCardClone);
      document.body.appendChild(tempContainer);
  
      // Wait for the clone to be rendered
      await new Promise(resolve => requestAnimationFrame(resolve));
  
      // Generate the canvas at full size
      const canvas = await html2canvas(idCardClone, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher quality
        width: 750,
        height: 1500,
        logging: false,
        ignoreElements: (element) => element.style.display === 'none'
      });
      
      // Clean up the temporary container
      tempContainer.remove();
      
      // Convert to PNG and trigger download
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
    const today = new Date('2026-03-19');
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    return expirationDate <= today;
  };

  // Add this function to update user status to Renewal
  const updateUserStatusToRenewal = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/updateUserStatus`, {
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

  const uploadToCloudinary = async (file, documentType) => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(prev => ({
      ...prev,
      [documentType]: 0
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);
      
      const folderPath = `${user.first_name}_${user.last_name}_${user.id}/documents`;
      formData.append('folder', folderPath);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [documentType]: progress
            }));
          }
        }
      );

      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          name: file.name,
          url: response.data.secure_url,
          public_id: response.data.public_id,
          status: 'uploaded'
        }
      }));

      try {
        // Just confirm with backend (no database operations)
        await axios.post(`${API_BASE_URL}/api/documents/save`);
      } catch (error) {
        console.warn('Backend confirmation failed:', error);
      }

      toast.success(`${documentType.toUpperCase()} uploaded successfully!`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${documentType}. Please try again.`);
      
      setDocuments(prev => ({
        ...prev,
        [documentType]: null
      }));
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({
        ...prev,
        [documentType]: 0
      }));
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only PDF, JPG, or PNG files');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size should not exceed 5MB');
      return;
    }

    // Upload to Cloudinary
    await uploadToCloudinary(file, type);
  };

  const handleRemoveDocument = async (documentType) => {
    try {
      const doc = documents[documentType];
      if (!doc || !doc.public_id) return;

      // Delete from Cloudinary
      await axios.post(`${API_BASE_URL}/api/documents/delete`, {
        userId: user.id,
        publicId: doc.public_id
      });

      // Update state
      setDocuments(prev => ({
        ...prev,
        [documentType]: null
      }));

      toast.success(`${documentType.toUpperCase()} removed successfully!`);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(`Failed to remove ${documentType}. Please try again.`);
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);
      formData.append('folder', 'Profile_Pics');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Update progress state if needed
          }
        }
      );

      // Update user's profile image
      setUser(prev => ({
        ...prev,
        profile_image: response.data.secure_url
      }));

      toast.success('Profile image uploaded successfully!');
    } catch (error) {
      console.error('Profile image upload error:', error);
      toast.error('Failed to upload profile image');
    }
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
    "Pending Remarks": <FaClock className="status-icon pending" />,
    Terminated: <FaTimes className="status-icon terminated" />
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
        <div className="profile-image-container">
          <img 
            src={user?.profile_image || avatar} 
            alt="Profile" 
            className="profile-image"
          />
          <div className="profile-image-overlay">
            <label htmlFor="profile-image-upload">
              <FaCamera className="camera-icon" />
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleProfileImageUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
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
          {["Details", "ID", "Documents"].map((tab) => (
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
                            <strong>Barangay:</strong>
                            <span>{user.barangay}</span>
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
                      {user.familyMembers && user.familyMembers.length > 0 ? (
                        <table className="children-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Age</th>
                              <th>Education</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.familyMembers
                              .filter(member => member.relationship === 'Child')
                              .map((child, index) => (
                                <tr key={index}>
                                  <td>{child.name}</td>
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
              ) : status === "Terminated" ? (
                <div className="verification-prompt terminated">
                  <h3>ID Not Available</h3>
                  <p>Your Solo Parent ID is no longer available as your application has been terminated.</p>
                  <p>Please contact your Barangay office for more information.</p>
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
          {activeTab === "Documents" && (
            <div className="documents-section">
              <h3>Required Documents</h3>
              <div className="document-list">
                {/* PSA Birth Certificate */}
                <div className="document-group">
                  <h4>PSA Birth Certificate</h4>
                  <div className="upload-area" onClick={() => handleUploadClick('psa')}>
                    {isUploading && uploadProgress.psa > 0 ? (
                      <div className="upload-progress">
                        <div className="progress-bar" style={{ width: `${uploadProgress.psa}%` }}></div>
                        <span>{uploadProgress.psa}%</span>
                      </div>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 16L12 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M9 11L12 8L15 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 16H16" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <p>Drag and drop or <span className="browse-link">browse</span></p>
                      </>
                    )}
                    <input 
                      id="file-input-psa"
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'psa')}
                    />
                  </div>
                  {documents.psa && (
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-name">{documents.psa.name}</span>
                        <span className="document-status uploaded">Uploaded</span>
                      </div>
                      <div className="document-actions">
                        <button className="document-upload-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Replace
                        </button>
                        <button className="cancel-btn" onClick={() => handleRemoveDocument('psa')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Income Tax Return */}
                <div className="document-group">
                  <h4>Income Tax Return (ITR)</h4>
                  <div className="upload-area" onClick={() => handleUploadClick('itr')}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16L12 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M9 11L12 8L15 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 16H16" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>Drag and drop or <span className="browse-link">browse</span></p>
                    <input 
                      id="file-input-itr"
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'itr')}
                    />
                  </div>
                  {documents.itr && (
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-name">{documents.itr.name}</span>
                        <span className="document-status uploaded">Uploaded</span>
                      </div>
                      <div className="document-actions">
                        <button className="document-upload-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Replace
                        </button>
                        <button className="cancel-btn" onClick={() => handleRemoveDocument('itr')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medical Certificate */}
                <div className="document-group">
                  <h4>Medical Certificate</h4>
                  <div className="upload-area" onClick={() => handleUploadClick('medical')}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16L12 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M9 11L12 8L15 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 16H16" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>Drag and drop or <span className="browse-link">browse</span></p>
                    <input 
                      id="file-input-medical"
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'medical')}
                    />
                  </div>
                  {documents.medical && (
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-name">{documents.medical.name}</span>
                        <span className="document-status uploaded">Uploaded</span>
                      </div>
                      <div className="document-actions">
                        <button className="document-upload-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Replace
                        </button>
                        <button className="cancel-btn" onClick={() => handleRemoveDocument('medical')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conditional Documents based on Civil Status */}
                {user.civil_status === 'Married' && (
                  <div className="document-group">
                    <h4>Marriage Certificate</h4>
                    <div className="upload-area" onClick={() => handleUploadClick('marriage')}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16L12 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 11L12 8L15 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 16H16" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <p>Drag and drop or <span className="browse-link">browse</span></p>
                      <input 
                        id="file-input-marriage"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'marriage')}
                      />
                    </div>
                    {documents.marriage && (
                      <div className="document-item">
                        <div className="document-info">
                          <span className="document-name">{documents.marriage.name}</span>
                          <span className="document-status uploaded">Uploaded</span>
                        </div>
                        <div className="document-actions">
                          <button className="document-upload-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Replace
                          </button>
                          <button className="cancel-btn" onClick={() => handleRemoveDocument('marriage')}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user.civil_status === 'Widowed' && (
                  <div className="document-group">
                    <h4>Death Certificate</h4>
                    <div className="upload-area" onClick={() => handleUploadClick('death')}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16L12 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 11L12 8L15 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 16H16" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <p>Drag and drop or <span className="browse-link">browse</span></p>
                      <input 
                        id="file-input-death"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'death')}
                      />
                    </div>
                    {documents.death && (
                      <div className="document-item">
                        <div className="document-info">
                          <span className="document-name">{documents.death.name}</span>
                          <span className="document-status uploaded">Uploaded</span>
                        </div>
                        <div className="document-actions">
                          <button className="document-upload-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Replace
                          </button>
                          <button className="cancel-btn" onClick={() => handleRemoveDocument('death')}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(!user.civil_status || user.civil_status === 'Single') && (
                  <div className="document-group">
                    <h4>CENOMAR</h4>
                    <div className="upload-area" onClick={() => handleUploadClick('cenomar')}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16L12 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 11L12 8L15 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 16H16" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <p>Drag and drop or <span className="browse-link">browse</span></p>
                      <input 
                        id="file-input-cenomar"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'cenomar')}
                      />
                    </div>
                    {documents.cenomar && (
                      <div className="document-item">
                        <div className="document-info">
                          <span className="document-name">{documents.cenomar.name}</span>
                          <span className="document-status uploaded">Uploaded</span>
                        </div>
                        <div className="document-actions">
                          <button className="document-upload-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Replace
                          </button>
                          <button className="cancel-btn" onClick={() => handleRemoveDocument('cenomar')}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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