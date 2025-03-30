import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; // Import CSS file
import { FaCamera, FaCheckCircle, FaClock, FaTimes, FaCog } from "react-icons/fa"; // Import icons
import avatar from "../assets/avatar.jpg";
import html2canvas from 'html2canvas';
import dswdLogo from '../assets/dswd-logo.png';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import FaceDetection from './FaceDetection';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("Details");
  const [user, setUser] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showFaceDetection, setShowFaceDetection] = useState(false);
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
      console.log('Updating user status to Renewal...');
      const response = await fetch(`${API_BASE_URL}/updateUserStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code_id: user.code_id,  // Add code_id
          status: "Renewal",
          email: user.email,
          firstName: user.first_name,
          action: "renewal"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const data = await response.json();
      console.log('Status update response:', data);

      // Update local state
      setUser(prev => ({
        ...prev,
        status: "Renewal"
      }));

      toast.success('Your ID has expired. Please submit your renewal application.');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update status to renewal');
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
        
        // Fetch user details which now includes documents
        const response = await axios.post(`${API_BASE_URL}/getUserDetails`, {
          userId: loggedInUserId
        });
        
        console.log('User details response:', response.data);
        
        if (response.data && Array.isArray(response.data.documents)) {
          console.log('Setting documents state with:', response.data.documents);
          setDocuments(response.data.documents);
        } else {
          console.log('No documents found in response:', response.data);
          setDocuments([]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
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
    death_cert: 'Death Certificate',
    barangay_cert: 'Barangay Certificate'  // Add barangay certificate type
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
      
      // For barangay certificate, use a different endpoint
      if (documentType === 'barangay_cert') {
        console.log('Uploading barangay certificate with data:', {
          code_id: user.code_id,
          file_name: documentUrl,
          display_name: file.name
        });
        
        const barangayCertResponse = await axios.post(`${API_BASE_URL}/api/documents/barangay_cert`, {
          code_id: user.code_id,
          file_name: documentUrl,
          display_name: file.name
        });
        
        console.log('Barangay certificate upload response:', barangayCertResponse.data);
      } else {
        // For other documents, use the existing endpoint
        await axios.post(`${API_BASE_URL}/api/documents/updateUserDocument`, {
          userId: loggedInUserId,
          documentType,
          documentUrl,
          displayName: file.name
        });
      }
      
      // Update local state
      setDocuments(prev => [
        ...prev,
        {
          url: documentUrl,
          public_id: response.data.public_id,
          name: file.name,
          status: 'uploaded',
          document_type: `${documentType}_documents`
        }
      ]);
      
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
    if (!documentType || !documents.find(doc => doc.document_type === `${documentType}_documents`)) return;

    const deletingToastId = toast.loading(`Deleting ${documentTypes[documentType]}...`);
    
    try {
      // Delete from both database and update state
      await axios.post(`${API_BASE_URL}/api/documents/deleteDocument`, {
        userId: loggedInUserId,
        documentType
      });

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.document_type !== `${documentType}_documents`));

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

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("UserId");
    localStorage.removeItem("id");
    localStorage.removeItem("barangay");
    navigate("/login");
  };

  const handleChangePassword = () => {
    // Navigate to change password page or open modal
    // For now, we'll just display a toast
    toast.info("Change password functionality will be available soon!");
  };

  const downloadID = async (side) => {
    try {
      // Get the element to capture based on side
      const targetElement = document.querySelector(side === 'back' ? '.id-back' : '.id-front');
      if (!targetElement) {
        console.error('Target element not found');
        return;
      }

      // Get the actual dimensions
      const rect = targetElement.getBoundingClientRect();

      // Capture the current state
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 3,
        width: rect.width,
        height: rect.height,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(side === 'back' ? '.id-back' : '.id-front');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
            clonedElement.style.display = 'flex';
            clonedElement.style.opacity = '1';
            
            // Make sure all content is visible
            const header = clonedElement.querySelector('.id-header');
            const body = clonedElement.querySelector('.id-body');
            const backContent = clonedElement.querySelector('.back-content');
            
            if (header) header.style.display = 'flex';
            if (body) body.style.display = 'flex';
            if (backContent) backContent.style.display = 'flex';
          }
        }
      });

      // Download the image
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${user.name}_SoloParent_ID_${side === 'back' ? 'Back' : 'Front'}.png`;
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

  // Function to ensure document URL is valid
  const getValidDocumentUrl = (doc) => {
    if (!doc) return null;
    
    // Check if file_url exists and is a string
    let url = doc.file_url || '';
    
    // If it's not a string, return null
    if (typeof url !== 'string') return null;
    
    // If it's an empty string, return null
    if (url.trim() === '') return null;
    
    // Ensure URL has proper protocol
    if (url && !url.startsWith('http')) {
      url = `http://${url}`;
    }
    
    return url;
  };

  const handlePhotoCapture = async (photoData) => {
    try {
      // Convert base64 to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      const file = new File([blob], "face_recognition.jpg", { type: "image/jpeg" });

      // Create form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `${CLOUDINARY_FOLDER}/${loggedInUserId}/face_recognition`);

      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      // Update faceRecognitionPhoto in database using updateUserProfile endpoint
      const updateResponse = await axios.post(
        `${API_BASE_URL}/updateUserProfile`,
        { 
          userId: loggedInUserId, 
          faceRecognitionPhoto: cloudinaryData.secure_url 
        }
      );

      if (updateResponse.data.success) {
        toast.success('Face recognition photo registered successfully!');
      } else {
        throw new Error('Failed to update face recognition photo');
      }
      
      setShowFaceDetection(false);
    } catch (error) {
      console.error('Error registering face photo:', error);
      toast.error('Failed to register face photo. Please try again.');
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
            {statusIcon[user.status] || statusIcon.Unverified}
            <span>{user.status}</span>
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
          
          {/* Register Photo Button */}
          <button
            className="tab-button register-photo-tab"
            onClick={() => setShowFaceDetection(true)}
          >
            <FaCamera className="register-camera-icon" />
          </button>
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
                  <span className="value">
                    {user.income}
                    {(() => {
                      let incomeValue = 0;
                      // If income is a direct number from database, use it directly
                      if (!isNaN(user.income)) {
                        incomeValue = parseFloat(user.income);
                      } else {
                        // Handle text-based income ranges
                        if (user.income === 'Below ₱10,000') {
                          incomeValue = 10000;
                        } else if (user.income === '₱11,000-₱20,000') {
                          incomeValue = 20000;
                        } else if (user.income === '₱21,000-₱43,000') {
                          incomeValue = 43000;
                        } else if (user.income === '₱44,000 and above') {
                          incomeValue = 250001; // Set high value to ensure no benefits
                        }
                      }
                      
                      // Only show benefits badge if income is strictly less than 250000
                      return incomeValue < 250001 ? (
                        <span className="beneficiary-badge">
                          <i className="fas fa-tag"></i> Eligible for Benefits
                        </span>
                      ) : null;
                    })()}
                  </span>
                </li>
                <li>
                  <span className="label">Contact Number</span>
                  <span className="value">{user.contact_number}</span>
                </li>
                <li>
                  <span className="label family">Family Composition</span>
                  {user.familyMembers && user.familyMembers.length > 0 ? (
                    <ul className="children-list">
                      {user.familyMembers.map((member, index) => (
                        <li key={index}>
                          <strong>Family Member {index + 1}: {member.family_member_name}</strong>
                          <div className="child-details">
                            <span>Age: {member.age}</span>
                            <span>Education: {member.educational_attainment}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="no-children">No family members registered</span>
                  )}
                </li>
              </ul>
            </div>
          )}
          {activeTab === "ID" && (
            <div className="id-tab">
              {user?.status === "Verified" ? (
                <div className="id-container">
                  <div className="card-container">
                    {/* Front of ID */}
                    <div className="digital-id">
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
                                src={addCacheBuster(getImageUrl(profilePicUrl))} 
                                alt="User" 
                                crossOrigin="anonymous" 
                                onError={(e) => {
                                  console.log("ID photo load error, using default avatar");
                                  e.target.onerror = null;
                                  e.target.src = avatar;
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
                      <button className="download-id-btn" onClick={() => downloadID('front')}>
                        Download Front
                      </button>
                    </div>

                    {/* Back of ID */}
                    <div className="digital-id">
                      <div className="id-back">
                        <div className="id-header">
                          <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                          <div className="id-title">
                            <h2>SOLO PARENT IDENTIFICATION CARD</h2>
                            <p>Republic of the Philippines</p>
                            <p className="id-subtitle">DSWD Region III</p>
                          </div>
                        </div>
                        <div className="back-content">
                          <div className="terms-section">
                            <h3>Terms and Conditions</h3>
                            <ol>
                              <li>This ID is non-transferable</li>
                              <li>Report loss/damage to DSWD office</li>
                              <li>Present this ID when availing benefits</li>
                              <li>Tampering invalidates this ID</li>
                            </ol>
                          </div>
                          <div className="signature-section">
                            <div className="signature-line">
                              <div className="line"></div>
                              <p>Card Holder's Signature</p>
                            </div>
                            <div className="signature-line">
                              <div className="line"></div>
                              <p>Authorized DSWD Official</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="download-id-btn" onClick={() => downloadID('back')}>
                        Download Back
                      </button>
                    </div>
                  </div>
                </div>
              ) : user?.status === "Terminated" ? (
                <div className="verification-prompt terminated">
                  <h3>ID Not Available</h3>
                  <p>Your Solo Parent ID is no longer available as your application has been terminated.</p>
                  <p>Please contact your Barangay office for more information.</p>
                </div>
              ) : user?.status === "Pending" ? (
                <div className="verification-prompt">
                  <h3>ID is being processed</h3>
                  <p>Please wait while your application is under review.</p>
                </div>
              ) : user?.status === "Renewal" ? (
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
              <h3>Submitted Documents</h3>
              
              {user.status === "Renewal" ? (
                <div className="renewal-documents">
                  <div className="renewal-message">
                    <h4>Renewal Application</h4>
                    <p>Please upload your Barangay Certificate to complete your renewal application.</p>
                  </div>
                  <div className="documents-table-container">
                    <table className="documents-table">
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Barangay Certificate</td>
                          <td className="status-cell">
                            {documents.find(doc => doc.document_type === 'barangay_cert_documents') ? (
                              <span className="status-submitted">
                                <i className="fas fa-check-circle"></i> Submitted
                              </span>
                            ) : (
                              <span className="status-pending">Not submitted yet</span>
                            )}
                          </td>
                          <td>
                            {documents.find(doc => doc.document_type === 'barangay_cert_documents') ? (
                              <button 
                                className="btn view-btn"
                                onClick={() => window.open(getValidDocumentUrl(documents.find(doc => doc.document_type === 'barangay_cert_documents')), '_blank')}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                            ) : (
                              <label className="btn upload-btn">
                                <i className="fas fa-upload"></i> Upload
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : user.status === "Verified" ? (
                <div className="documents-table-container">
                  <table className="documents-table">
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const docType = doc.document_type.replace('_documents', '');
                        const displayName = documentTypes[docType] || docType;
                        const documentUrl = getValidDocumentUrl(doc);
                        
                        return (
                          <tr key={doc.document_type}>
                            <td>{displayName}</td>
                            <td className="status-cell">
                              {documentUrl ? (
                                <span className="status-submitted">
                                  <i className="fas fa-check-circle"></i> Submitted
                                </span>
                              ) : (
                                <span className="status-pending">Not submitted yet</span>
                              )}
                            </td>
                            <td>
                              {documentUrl && (
                                <button 
                                  className="btn view-btn"
                                  onClick={() => window.open(documentUrl, '_blank')}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : user.status === "Renewal" ? (
                <div className="resubmit-documents">
                  <div className="resubmit-message">
                    <h4>Resubmission Required</h4>
                    <p>Please upload your documents again as requested.</p>
                  </div>
                  <div className="documents-table-container">
                    <table className="documents-table">
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => {
                          const docType = doc.document_type.replace('_documents', '');
                          const displayName = documentTypes[docType] || docType;
                          const documentUrl = getValidDocumentUrl(doc);
                          
                          return (
                            <tr key={doc.document_type}>
                              <td>{displayName}</td>
                              <td className="status-cell">
                                {documentUrl ? (
                                  <span className="status-submitted">
                                    <i className="fas fa-check-circle"></i> Submitted
                                  </span>
                                ) : (
                                  <span className="status-pending">Not submitted yet</span>
                                )}
                              </td>
                              <td>
                                {documentUrl ? (
                                  <button 
                                    className="btn view-btn"
                                    onClick={() => window.open(documentUrl, '_blank')}
                                  >
                                    <i className="fas fa-eye"></i> View
                                  </button>
                                ) : (
                                  <label className="btn upload-btn">
                                    <i className="fas fa-upload"></i> Upload
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleDocumentChange(e, docType)}
                                      style={{ display: 'none' }}
                                    />
                                  </label>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="no-documents-message">
                  <p>No documents available for your current status.</p>
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
                src={previewUrl || addCacheBuster(getImageUrl(profilePicUrl))} 
                alt="Preview"
                className="preview-image"
                onError={(e) => {
                  console.log("Preview image load error, using default avatar");
                  e.target.onerror = null;
                  e.target.src = avatar;
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

      {showFaceDetection && (
        <div className="modal-overlay">
          <div className="modal-content face-detection-modal">
            <h3>Register Face Recognition Photo</h3>
            <FaceDetection onPhotoCapture={handlePhotoCapture} />
            <div className="modal-buttons">
              <button
                className="cancel-btn-user"
                onClick={() => setShowFaceDetection(false)}
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