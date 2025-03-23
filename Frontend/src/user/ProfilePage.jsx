import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; // Import CSS file
import { FaCamera, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa"; // Import icons
import avatar from "../assets/avatar.jpg";
import html2canvas from 'html2canvas';
import dswdLogo from '../assets/dswd-logo.png';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

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
    med_cert: null,
    marriage: null,
    cenomar: null,
    death_cert: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const navigate = useNavigate();

  const loggedInUserId = localStorage.getItem("UserId");

  // Update these constants at the top of your component
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';  // Make sure this matches your Cloudinary upload preset
  const CLOUDINARY_FOLDER = 'soloparent/users';

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  // Add this function to check if ID is expired
  const isIDExpired = () => {
    if (!user?.validUntil) return false;
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
              toast.success("Congratulations! Your application has been approved!");
            } else if (data.status === "Unverified" && previousStatus === "Pending") {
              toast.error("Your application has been declined. Please check with the admin for more details.");
            } else if (data.status === "Terminated") {
              toast.error("Your Solo Parent application has been terminated. Please contact your Barangay for more information.");
            } else if (data.status === "Pending Remarks") {
              toast.info("Your application is under investigation. Please wait for the admin's response.");
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
  }, [loggedInUserId, navigate, API_BASE_URL, previousStatus]);

  // Check expiration only once when user data is loaded
  useEffect(() => {
    if (user && isIDExpired() && user.status !== "Renewal") {
      updateUserStatusToRenewal();
    }
  }, [user, isIDExpired, updateUserStatusToRenewal]);

  // Effect to refresh component when user data changes
  useEffect(() => {
    // This will ensure the component refreshes when user data changes
    setRefreshKey(oldKey => oldKey + 1);
  }, [user?.profilePic]);

  // Add this near the top with other useEffect hooks
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!loggedInUserId) return;
      
      try {
        console.log('Fetching documents for user:', loggedInUserId);
        const response = await axios.get(`${API_BASE_URL}/api/documents/getUserDocuments/${loggedInUserId}`);
        console.log('Documents response:', response.data);
        if (response.data.success) {
          setDocuments(response.data.documents);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        toast.error('Failed to load documents');
      }
    };

    fetchDocuments();
  }, [loggedInUserId]);

  // Add this near the top of your component
  const documentTypes = {
    psa: 'PSA Birth Certificate',
    itr: 'Income Tax Return',
    med_cert: 'Medical Certificate',
    marriage: 'Marriage Certificate',
    cenomar: 'CENOMAR',
    death_cert: 'Death Certificate'
  };

  const uploadDocument = async (file, documentType) => {
    if (!file) return;

    const uploadingToastId = toast.loading(`Uploading ${documentTypes[documentType]}...`);
    setIsUploading(true);
    
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG/PNG) or PDF');
      }

      // Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `${CLOUDINARY_FOLDER}/${loggedInUserId}/documents/${documentType}`);

      // Upload to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [documentType]: percentCompleted
            }));
          }
        }
      );
      
      const documentUrl = response.data.secure_url;
      
      // Save to database
      await axios.post(`${API_BASE_URL}/api/documents/updateUserDocument`, {
        userId: loggedInUserId,
        documentType,
        documentUrl,
        displayName: file.name
      });
      
      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          url: documentUrl,
          public_id: response.data.public_id,
          name: file.name,
          status: 'uploaded'
        }
      }));
      
      toast.dismiss(uploadingToastId);
      toast.success(`${documentTypes[documentType]} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      toast.dismiss(uploadingToastId);
      toast.error(error.message || `Failed to upload ${documentType}. Please try again.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({
        ...prev,
        [documentType]: 0
      }));
    }
  };

  const handleDocumentChange = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadDocument(file, documentType);
  };

  const confirmDelete = (documentType) => {
    setDocumentToDelete(documentType);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    const documentType = documentToDelete;
    if (!documentType || !documents[documentType]) return;

    const deletingToastId = toast.loading(`Deleting ${documentTypes[documentType]}...`);
    
    try {
      // Delete from both database and update state
      await axios.post(`${API_BASE_URL}/api/documents/deleteDocument`, {
        userId: loggedInUserId,
        documentType
      });

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentType]: null
      }));

      toast.dismiss(deletingToastId);
      toast.success(`${documentTypes[documentType]} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${documentType}:`, error);
      toast.dismiss(deletingToastId);
      toast.error(`Failed to delete ${documentTypes[documentType]}. Please try again.`);
    } finally {
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const handleDeleteCancelled = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleRemoveDocument = async (documentType) => {
    confirmDelete(documentType);
  };

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
      toast.error('Failed to download ID. Please try again.');
    }
  };

  const handleSendApplication = () => {
    navigate("/form", { state: { userId: loggedInUserId } }); // Navigate to the form page
  };

  const getProfilePicture = () => {
    // First check if user has profilePic property
    if (user?.profilePic) {
      return user.profilePic;
    }
    
    // Clear localStorage if user doesn't have a profile pic
    // This ensures we don't use stale cached data
    localStorage.removeItem(`profilePic_${loggedInUserId}`);
    
    // Fallback to default avatar
    return avatar;
  };
  
  // Get the profile picture URL
  const profilePicUrl = getProfilePicture();
  
  // Modify this function to prevent constant refreshing and handle errors
  const getImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined' || url === avatar) {
      return avatar;
    }
    return url;
  };

  // Function to check if an image exists
  const checkImageExists = async (url) => {
    if (!url || url === avatar) return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error("Error checking image:", error);
      return false;
    }
  };
  
  // Effect to verify profile picture exists
  useEffect(() => {
    const verifyProfilePic = async () => {
      if (profilePicUrl && profilePicUrl !== avatar) {
        const exists = await checkImageExists(profilePicUrl);
        if (!exists) {
          // Image doesn't exist, clear from localStorage
          localStorage.removeItem(`profilePic_${loggedInUserId}`);
          // Force a component update
          setRefreshKey(oldKey => oldKey + 1);
        }
      }
    };
    
    verifyProfilePic();
  }, [profilePicUrl, loggedInUserId]);

  // Add cache-busting parameter to image URLs to prevent browser caching
  const addCacheBuster = (url) => {
    if (!url || url === avatar) return url;
    // Add a timestamp to force browser to reload the image
    return `${url}?t=${new Date().getTime()}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only image files (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size should not exceed 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !loggedInUserId) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB');
      return;
    }
    
    setIsUploading(true);
    const uploadingToastId = toast.loading('Uploading profile picture...');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `${CLOUDINARY_FOLDER}/${loggedInUserId}/profile`);
      
      const instance = axios.create();
      
      const response = await instance.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              profilePic: percentCompleted
            }));
          }
        }
      );
      
      const imageUrl = response.data.secure_url;
      
      // Update user profile in database
      const apiResponse = await axios.post(
        `${API_BASE_URL}/updateUserProfile`,
        { userId: loggedInUserId, profilePic: imageUrl }
      );
      
      if (apiResponse.data.success) {
        // Update local state
        if (user) {
          setUser({ ...user, profilePic: imageUrl });
        }
        
        // Update localStorage
        localStorage.setItem(`profilePic_${loggedInUserId}`, imageUrl);
        
        toast.dismiss(uploadingToastId);
        toast.success('Profile picture updated successfully');
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadProgress(prev => ({
          ...prev,
          profilePic: 0
        }));
        
        // Force refresh to show new image
        setRefreshKey(oldKey => oldKey + 1);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.dismiss(uploadingToastId);
      toast.error('Failed to upload profile picture. Please try again.');
      
      // Clear localStorage cache if upload fails
      localStorage.removeItem(`profilePic_${loggedInUserId}`);
    } finally {
      setIsUploading(false);
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

  return (
    <div className="profile-container" key={refreshKey}>
      <Toaster />
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this document?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleDeleteCancelled}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteConfirmed}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div className="profile-header">
        <div className="profile-image-container">
          <img 
            src={addCacheBuster(getImageUrl(profilePicUrl))} 
            alt="Profile" 
            className="profile-image"
            onError={(e) => {
              console.log("Image load error, using default avatar");
              e.target.onerror = null;
              e.target.src = avatar;
              // Clear localStorage if image fails to load
              localStorage.removeItem(`profilePic_${loggedInUserId}`);
            }}
          />
          <div className="profile-image-overlay" onClick={() => setShowUploadModal(true)}>
            <FaCamera className="camera-icon" />
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
          {activeTab === "Details" && (
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
          )}
          {activeTab === "ID" && (
            <div className="id-tab">
              {status === "Verified" ? (
                <div className="id-container">
                  <div id="idCard" className="digital-id">
                    {/* Front of ID */}
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
                            src={addCacheBuster(getImageUrl(profilePicUrl))} 
                            alt="User" 
                            crossOrigin="anonymous" 
                            onError={(e) => {
                              console.log("ID photo load error, using default avatar");
                              e.target.onerror = null;
                              e.target.src = avatar;
                              // Clear localStorage if image fails to load
                              localStorage.removeItem(`profilePic_${loggedInUserId}`);
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
                  <h4>{documentTypes.psa}</h4>
                  <div className="upload-area" onClick={() => document.getElementById('file-input-psa').click()}>
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
                      onChange={(e) => handleDocumentChange(e, 'psa')}
                      disabled={isUploading}
                    />
                  </div>
                  {documents.psa && (
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-name">{documents.psa.name}</span>
                        <span className="document-status uploaded">Uploaded</span>
                      </div>
                      <div className="document-actions">
                        <a href={documents.psa.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                          View
                        </a>
                        <button className="document-upload-btn" onClick={() => document.getElementById('file-input-psa').click()}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Replace
                        </button>
                        <button className="cancel-btn" onClick={() => confirmDelete('psa')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Income Tax Return */}
                <div className="document-group">
                  <h4>{documentTypes.itr}</h4>
                  <div className="upload-area" onClick={() => document.getElementById('file-input-itr').click()}>
                    {isUploading && uploadProgress.itr > 0 ? (
                      <div className="upload-progress">
                        <div className="progress-bar" style={{ width: `${uploadProgress.itr}%` }}></div>
                        <span>{uploadProgress.itr}%</span>
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
                      id="file-input-itr"
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocumentChange(e, 'itr')}
                      disabled={isUploading}
                    />
                  </div>
                  {documents.itr && (
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-name">{documents.itr.name}</span>
                        <span className="document-status uploaded">Uploaded</span>
                      </div>
                      <div className="document-actions">
                        <a href={documents.itr.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                          View
                        </a>
                        <button className="document-upload-btn" onClick={() => document.getElementById('file-input-itr').click()}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Replace
                        </button>
                        <button className="cancel-btn" onClick={() => confirmDelete('itr')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medical Certificate */}
                <div className="document-group">
                  <h4>{documentTypes.med_cert}</h4>
                  <div className="upload-area" onClick={() => document.getElementById('file-input-medical').click()}>
                    {isUploading && uploadProgress.med_cert > 0 ? (
                      <div className="upload-progress">
                        <div className="progress-bar" style={{ width: `${uploadProgress.med_cert}%` }}></div>
                        <span>{uploadProgress.med_cert}%</span>
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
                      id="file-input-medical"
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocumentChange(e, 'med_cert')}
                      disabled={isUploading}
                    />
                  </div>
                  {documents.med_cert && (
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-name">{documents.med_cert.name}</span>
                        <span className="document-status uploaded">Uploaded</span>
                      </div>
                      <div className="document-actions">
                        <a href={documents.med_cert.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                          View
                        </a>
                        <button className="document-upload-btn" onClick={() => document.getElementById('file-input-medical').click()}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Replace
                        </button>
                        <button className="cancel-btn" onClick={() => confirmDelete('med_cert')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conditional Documents based on Civil Status */}
                {user.civil_status === 'Married' && (
                  <div className="document-group">
                    <h4>{documentTypes.marriage}</h4>
                    <div className="upload-area" onClick={() => document.getElementById('file-input-marriage').click()}>
                      {isUploading && uploadProgress.marriage > 0 ? (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${uploadProgress.marriage}%` }}></div>
                          <span>{uploadProgress.marriage}%</span>
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
                        id="file-input-marriage"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocumentChange(e, 'marriage')}
                        disabled={isUploading}
                      />
                    </div>
                    {documents.marriage && (
                      <div className="document-item">
                        <div className="document-info">
                          <span className="document-name">{documents.marriage.name}</span>
                          <span className="document-status uploaded">Uploaded</span>
                        </div>
                        <div className="document-actions">
                          <a href={documents.marriage.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                            View
                          </a>
                          <button className="document-upload-btn" onClick={() => document.getElementById('file-input-marriage').click()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Replace
                          </button>
                          <button className="cancel-btn" onClick={() => confirmDelete('marriage')}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user.civil_status === 'Widowed' && (
                  <div className="document-group">
                    <h4>{documentTypes.death_cert}</h4>
                    <div className="upload-area" onClick={() => document.getElementById('file-input-death').click()}>
                      {isUploading && uploadProgress.death_cert > 0 ? (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${uploadProgress.death_cert}%` }}></div>
                          <span>{uploadProgress.death_cert}%</span>
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
                        id="file-input-death"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocumentChange(e, 'death_cert')}
                        disabled={isUploading}
                      />
                    </div>
                    {documents.death_cert && (
                      <div className="document-item">
                        <div className="document-info">
                          <span className="document-name">{documents.death_cert.name}</span>
                          <span className="document-status uploaded">Uploaded</span>
                        </div>
                        <div className="document-actions">
                          <a href={documents.death_cert.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                            View
                          </a>
                          <button className="document-upload-btn" onClick={() => document.getElementById('file-input-death').click()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Replace
                          </button>
                          <button className="cancel-btn" onClick={() => confirmDelete('death_cert')}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(!user.civil_status || user.civil_status === 'Single') && (
                  <div className="document-group">
                    <h4>{documentTypes.cenomar}</h4>
                    <div className="upload-area" onClick={() => document.getElementById('file-input-cenomar').click()}>
                      {isUploading && uploadProgress.cenomar > 0 ? (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${uploadProgress.cenomar}%` }}></div>
                          <span>{uploadProgress.cenomar}%</span>
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
                        id="file-input-cenomar"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocumentChange(e, 'cenomar')}
                        disabled={isUploading}
                      />
                    </div>
                    {documents.cenomar && (
                      <div className="document-item">
                        <div className="document-info">
                          <span className="document-name">{documents.cenomar.name}</span>
                          <span className="document-status uploaded">Uploaded</span>
                        </div>
                        <div className="document-actions">
                          <a href={documents.cenomar.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                            View
                          </a>
                          <button className="document-upload-btn" onClick={() => document.getElementById('file-input-cenomar').click()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Replace
                          </button>
                          <button className="cancel-btn" onClick={() => confirmDelete('cenomar')}>
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
                src={previewUrl || addCacheBuster(getImageUrl(profilePicUrl))} 
                alt="Preview"
                className="preview-image"
                onError={(e) => {
                  console.log("Preview image load error, using default avatar");
                  e.target.onerror = null;
                  e.target.src = avatar;
                  // Clear localStorage if image fails to load
                  localStorage.removeItem(`profilePic_${loggedInUserId}`);
                }}
              />
              {isLoading && uploadProgress.profilePic > 0 && (
                <div className="upload-progress-container">
                  <div className="upload-progress-bar" style={{ width: `${uploadProgress.profilePic}%` }}></div>
                  <span className="upload-progress-text">{uploadProgress.profilePic}%</span>
                </div>
              )}
            </div>
            <input
              type="file"
              id="profilePicInput"
              accept="image/*"
              onChange={(e) => handleFileChange(e)}
              style={{ display: "none" }}
            />
            <div className="modal-buttons">
              <button 
                className="upload-photo-btn" 
                onClick={() => document.getElementById('profilePicInput').click()}
                disabled={isLoading}
              >
                Choose Photo
              </button>
              <button
                className="save-photo-btn"
                onClick={handleUploadSubmit}
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? `Uploading...` : "Save Photo"}
              </button>
              <button
                className="cancel-btn-user"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                disabled={isLoading}
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