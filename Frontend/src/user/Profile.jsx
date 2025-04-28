import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';
import './ResendApplicationModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faTimes,
  faCamera,
  faLocationDot, // Add this
  faTimesCircle, // Add this
  faClock
} from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import avatar from '../assets/avatar.jpg';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import LogoutModal from '../components/LogoutModal';
import { QRCodeSVG } from 'qrcode.react';
import dswdLogo from '../assets/dswd-logo.png';

const Profile = () => {
  const [showResendModal, setShowResendModal] = useState(false);
  const [declinedInfo, setDeclinedInfo] = useState(null);
  const [isDeclinedLoading, setIsDeclinedLoading] = useState(false);

  // Fetch declined info when resend modal opens
  useEffect(() => {
    if (showResendModal) {
      setIsDeclinedLoading(true);
      axios.get(`http://localhost:8081/declineInfo?userId=${loggedInUserId}`, { withCredentials: true })
        .then(res => {
          setDeclinedInfo(res.data);
        })
        .catch(err => {
          setDeclinedInfo(null);
        })
        .finally(() => setIsDeclinedLoading(false));
    }
  }, [showResendModal]);

  // ...rest of the Profile component code


  // ...rest of Profile


  const [activeTab, setActiveTab] = useState('personal');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [uploadProgress, setUploadProgress] = useState({});
  const [user, setUser] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [events, setEvents] = useState([]);
  const [attendanceModal, setAttendanceModal] = useState({
    show: false,
    message: '',
    attended: false
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';
  const CLOUDINARY_FOLDER = 'soloparent/users';

  const documentTypes = {
    psa: 'PSA Birth Certificate',
    itr: 'Income Tax Return',
    med_cert: 'Medical Certificate',
    marriage: 'Marriage Certificate',
    cenomar: 'CENOMAR',
    death_cert: 'Death Certificate',
    barangay_cert: 'Barangay Certificate'
  };

  // Add function to get documents based on civil status
  const getDocumentsByCivilStatus = (civilStatus) => {
    const baseDocuments = ['psa', 'itr', 'med_cert'];
    
    switch (civilStatus?.toLowerCase()) {
      case 'single':
        return [...baseDocuments, 'cenomar'];
      case 'married':
        return [...baseDocuments, 'marriage'];
      case 'divorced':
        return [...baseDocuments, 'marriage'];
      case 'widowed':
        return [...baseDocuments, 'marriage', 'death_cert'];
      default:
        return baseDocuments;
    }
  };

  // Add these functions for profile picture handling
  const getProfilePicture = () => {
    if (user?.profilePic) {
      return user.profilePic;
    }
    const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
    return cachedProfilePic || avatar;
  };

  const getImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined' || url === avatar) {
      return avatar;
    }
    return url;
  };

  const addCacheBuster = (url) => {
    if (!url || url === avatar) return url;
    return `${url}?t=${new Date().getTime()}`;
  };

  // Update the handleFileSelect function
  const fileInputRef = useRef(null);
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
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
    setShowUploadModal(true);
  };

  // Helper to reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update the handleUploadProfilePic function
  const handleUploadProfilePic = async () => {
    if (!selectedFile || !loggedInUserId) return;
    
    setIsUploading(true);
    const uploadingToastId = toast.loading('Uploading profile picture...');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `${CLOUDINARY_FOLDER}/${loggedInUserId}/profile`);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await response.json();
      
      if (cloudinaryData.secure_url) {
        const updateResponse = await fetch(`${API_BASE_URL}/updateUserProfile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUserId,
            profilePic: cloudinaryData.secure_url,
          }),
        });

        if (updateResponse.ok) {
          setUser(prev => ({ ...prev, profilePic: cloudinaryData.secure_url }));
          localStorage.setItem(`profilePic_${loggedInUserId}`, cloudinaryData.secure_url);
          toast.dismiss(uploadingToastId);
          toast.success('Profile picture updated successfully');
          setShowUploadModal(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          setRefreshKey(oldKey => oldKey + 1);
        } else {
          throw new Error('Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.dismiss(uploadingToastId);
      toast.error('Failed to upload profile picture. Please try again.');
      localStorage.removeItem(`profilePic_${loggedInUserId}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Update the useEffect for fetching user details
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
        console.log("Received user data:", data);

        if (response.ok) {
          if (data.profilePic) {
            localStorage.setItem(`profilePic_${loggedInUserId}`, data.profilePic);
          } else {
            const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
            if (cachedProfilePic) {
              data.profilePic = cachedProfilePic;
            }
          }
          console.log("Setting user data:", data);
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
  }, [loggedInUserId, API_BASE_URL]);

  // Add responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect to refresh component when user data changes
  useEffect(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, [user?.profilePic]);

  // Add this function to validate document URL
  const getValidDocumentUrl = (doc) => {
    if (!doc) return null;
    
    let url = doc.file_url || '';
    
    if (typeof url !== 'string') return null;
    if (url.trim() === '') return null;
    
    if (url && !url.startsWith('http')) {
      url = `http://${url}`;
    }
    
    return url;
  };

  // Update the uploadDocument function to set status to 'Pending' for Barangay Certificate
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
      
      if (documentType === 'barangay_cert') {
        // Only upload to barangay_cert_documents for barangay_cert
        await axios.post(`${API_BASE_URL}/api/documents/barangay_cert`, {
          code_id: user.code_id,
          file_name: documentUrl,
          display_name: file.name,
          status: 'Pending'
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/documents/follow_up`, {
          code_id: user.code_id,
          document_type: documentType,
          status: 'Pending',
          file_url: documentUrl,
          display_name: file.name
        });
        await axios.post(`${API_BASE_URL}/api/documents/${documentType}`, {
          code_id: user.code_id,
          file_name: documentUrl,
          display_name: file.name,
          status: 'Pending'
        });
      }
      
      // Update local state
      setDocuments(prev => [
        ...prev,
        {
          url: documentUrl,
          public_id: response.data.public_id,
          name: file.name,
          status: 'Pending',
          document_type: `${documentType}_documents`
        }
      ]);
      
      toast.dismiss(uploadingToastId);
      toast.success(`${documentTypes[documentType]} uploaded successfully and is pending verification`);
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
      await axios.post(`${API_BASE_URL}/api/documents/deleteDocument`, {
        userId: loggedInUserId,
        documentType
      });

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

  // Add fetchDocuments function
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user details:', data);
        if (data && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        } else {
          setDocuments([]);
        }
      } else {
        console.error('Error fetching user details:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Add useEffect to fetch documents
  useEffect(() => {
    if (loggedInUserId) {
      fetchDocuments();
    }
  }, [loggedInUserId, refreshKey]);

  // Add this function to fetch events
  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:8081/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Add this useEffect to fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  // Add this function to format date and time
  const formatDateTime = (date, time) => {
    if (!date || !time) return '';
    const formattedDate = new Date(date).toLocaleDateString();
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour % 12 || 12;
    return `${formattedDate} ${formattedHour}:${minutes} ${ampm}`;
  };

  const checkAttendance = async (eventId) => {
    try {
      if (!user || !user.code_id) {
        toast.error('User information not available');
        return;
      }

      const response = await axios.post(
        'http://localhost:8081/api/events/checkAttendance',
        { 
          eventId: eventId,
          userId: user.code_id  // Using code_id as the userId for attendance check
        }
      );
      
      if (response.data.attended !== undefined) {
        setAttendanceModal({
          show: true,
          message: response.data.attended 
            ? 'You have attended this event' 
            : 'You have not attended this event yet',
          attended: response.data.attended
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      toast.error('Unable to check attendance status');
      setAttendanceModal({
        show: true,
        message: 'Unable to check attendance status',
        attended: false
      });
    }
  };

  const AttendanceModal = () => (
    <div className={`attendance-modal ${attendanceModal.show ? 'show' : ''}`}>
      <div className="modal-content">
        {attendanceModal.attended ? (
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" size="3x" />
        ) : (
          <FontAwesomeIcon icon={faTimesCircle} className="error-icon" size="3x" />
        )}
        <p className={attendanceModal.attended ? 'success' : 'warning'}>
          {attendanceModal.message}
        </p>
        <button 
          onClick={() => setAttendanceModal({...attendanceModal, show: false})}
          className="modal-close-btn"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Rename and update the function to check for restricted access
  const hasRestrictedAccess = () => {
    return user?.status === 'Pending Remarks' || user?.status === 'Terminated';
  };

  // Add function to check if all required documents are submitted and approved
  const checkDocumentCompletion = () => {
    if (!user || !user.civil_status) return false;
    
    const requiredDocuments = getDocumentsByCivilStatus(user.civil_status);
    const submittedDocuments = documents.map(doc => doc.document_type.replace('_documents', ''));
    
    // Check if all required documents are submitted AND approved
    const allDocumentsApproved = requiredDocuments.every(docType => {
      const document = documents.find(doc => doc.document_type === `${docType}_documents`);
      return document && document.status === 'Approved';
    });
    
    return allDocumentsApproved;
  };

  // Add function to update user status based on document completion
  const updateUserStatus = async () => {
    if (!user || !user.code_id) {
      console.error('Cannot update status: User or code_id is missing');
      return;
    }
    
    const isComplete = checkDocumentCompletion();
    const currentStatus = user.status;
    
    // Only update if status needs to change
    if ((isComplete && currentStatus === 'Incomplete') || 
        (!isComplete && currentStatus === 'Verified')) {
      try {
        const response = await axios.post(`${API_BASE_URL}/updateUserStatusIncompleteDocuments`, {
          code_id: user.code_id,
          status: isComplete ? 'Verified' : 'Incomplete'
        });
        
        if (response.data.success) {
          setUser(prev => ({
            ...prev,
            status: isComplete ? 'Verified' : 'Incomplete'
          }));
        }
      } catch (error) {
        console.error('Error updating user status:', error);
        toast.error('Failed to update status. Please try again later.');
      }
    }
  };

  // Add useEffect to check document completion when documents change
  useEffect(() => {
    if (user && documents.length > 0) {
      updateUserStatus();
    }
  }, [documents, user]);

  useEffect(() => {
    const handlePopState = (event) => {
      setShowLogoutModal(true);
      window.history.pushState(null, '', window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
      sessionStorage.clear();
    }
    window.location.replace('/mainpage');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Enhanced Upload Modal component
  const UploadModal = () => (
    <div className="upload-profile-modal-overlay show">
      <div className="upload-profile-modal">
        <div className="upload-profile-modal-header">
          <h2>Upload Profile Picture</h2>
          <button
            className="upload-profile-modal-close-btn"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setPreviewUrl(null);
              resetFileInput();
            }}
            disabled={isUploading}
          >
            &times;
          </button>
        </div>
        <div className="upload-profile-modal-body">
          {previewUrl ? (
            <div className="upload-profile-image-preview-wrapper">
              <img
                src={previewUrl}
                alt="Selected profile picture preview"
                className="upload-profile-image-preview"
                onError={() => {
                  setPreviewUrl(null);
                  toast.error('Failed to load image preview');
                }}
              />
            </div>
          ) : (
            <div className="upload-profile-no-preview">
              <FontAwesomeIcon icon={faCamera} size="3x" />
              <p>No image selected</p>
            </div>
          )}
          <div className="upload-profile-file-input-wrapper">
            <label className="upload-profile-file-input-label">
              <FontAwesomeIcon icon={faCamera} /> Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                ref={fileInputRef}
              />
            </label>
            {selectedFile && (
              <p className="upload-profile-file-info">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
        <div className="upload-profile-modal-footer">
          <button
            className="upload-profile-btn cancel-btn"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setPreviewUrl(null);
              resetFileInput();
            }}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            className={`upload-profile-btn confirm-btn ${isUploading ? 'uploading' : ''}`}
            onClick={handleUploadProfilePic}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="upload-profile-spinner"></span>
                Uploading...
              </>
            ) : 'Confirm Upload'}
          </button>
        </div>
      </div>
    </div>
  );

  // Add this function to check if ID is expired
  const isIDExpired = () => {
    if (!user?.validUntil) return false;
    const expirationDate = new Date(user.validUntil);
    // Use the actual current date (2025-04-21) as provided by the system
    const today = new Date('2025-04-28');
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    return expirationDate < today; // Expired if expirationDate is before today
  };

  // Define the updateUserStatusToRenewal function before useEffect
  const updateUserStatusToRenewal = async () => {
    try {
      console.log('Attempting to update user status to Renewal...');
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

      console.log('User status updated to Renewal in local state.');
      toast.success('Your ID has expired. Please submit your renewal application.');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update status to renewal');
    }
  };

  // Enhanced logging to diagnose the issue
  useEffect(() => {
    console.log('Checking if ID is expired...');
    console.log('User validUntil:', user?.validUntil);
    console.log('Current date:', new Date());
    console.log('Is ID expired:', isIDExpired());
    if (user && isIDExpired() && user.status !== "Renewal") {
      console.log('ID is expired, updating status to Renewal...');
      updateUserStatusToRenewal();
    }
  }, [user, isIDExpired, updateUserStatusToRenewal]);

  // Determine if the user's status is 'Renewal'
  const isRenewalStatus = user && user.status === 'Renewal';

  return (
    <div className="profile-container">
      <Toaster position="top-right" />
      {showUploadModal && <UploadModal />}
      <AttendanceModal />
      <LogoutModal isOpen={showLogoutModal} onConfirm={confirmLogout} onCancel={cancelLogout} />
      <div className="dashboard-main">
        <div className="profile-header">
          <div className="profile-cover">
            <div className="profile-info">
              <div className="profile-pic-container">
                <img 
                  src={addCacheBuster(getImageUrl(getProfilePicture()))} 
                  alt={user?.first_name || 'Profile'} 
                  className="profile-pic"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = avatar;
                    localStorage.removeItem(`profilePic_${loggedInUserId}`);
                  }}
                />
                {!hasRestrictedAccess() && user?.status !== 'Incomplete' && (
                  <label className="edit-profile-pic" aria-label="Edit profile picture">
                    <FontAwesomeIcon icon={faCamera} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                    />
                  </label>
                )}
              </div>
              <div className="profile-text">
                <h1>
                  {user ? (
                    user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.name || 'First Name Last Name'
                  ) : 'Loading...'}
                </h1>
                <p className="user-email">{user?.email || 'Loading...'}</p>
                <div className="profile-tags">
                  <span className={`tag ${user?.status?.toLowerCase()}-tag`}>
                    {!['Pending Remarks', 'Terminated', 'Incomplete', 'Declined'].includes(user?.status) && (
                      <FontAwesomeIcon icon={faCheckCircle} />
                    )}
                    {user?.status || 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {user?.status === 'Declined' && (
          <>
            <div className="declined-message">
              <div className="declined-content">
                <FontAwesomeIcon icon={faTimesCircle} className="warning-icon" size="3x" />
                <h2>Application Declined</h2>
                <p>Your application has been declined. You may resend your application for reconsideration.</p>
                <button
                  className="btn resend-btn"
                  onClick={() => setShowResendModal(true)}
                  style={{ marginTop: '20px', background: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', padding: '12px 28px', borderRadius: '8px' }}
                >
                  Resend Application
                </button>
              </div>
            </div>
            {showResendModal && (
  <ResendApplicationModal onClose={() => setShowResendModal(false)} />
)}
          </>
        )}

        {user?.status === 'Incomplete' ? (
          <div className="incomplete-message">
            <div className="incomplete-content">
              <FontAwesomeIcon icon={faTimesCircle} className="warning-icon" size="3x" />
              <h2>Incomplete Documents</h2>
              <p>Please submit all required documents to complete your application.</p>
              <p>You can submit your documents below.</p>
            </div>
          </div>
        ) : hasRestrictedAccess() ? (
          <div className="pending-remarks-message">
            <div className="pending-remarks-content">
              <FontAwesomeIcon icon={faTimesCircle} className="warning-icon" size="3x" />
              <h2>
                {user?.status === 'Terminated' ? 'Account Terminated' : 'Account Under Investigation'}
              </h2>
              <p>
                {user?.status === 'Terminated' 
                  ? 'Your account has been terminated. You no longer have access to solo parent services.'
                  : 'Your account is currently under investigation. Please wait for further notice from the administrator.'}
              </p>
              <p>If you have any questions, please contact your barangay office.</p>
            </div>
          </div>
        ) : null}

        <div className="dashboard-content">
          {user?.status === 'Incomplete' ? (
            <div className="documents-section-user">
              <div className="section-header">
                <h2>Documents</h2>
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
                    {getDocumentsByCivilStatus(user.civil_status).map((documentType) => {
                      const document = documents.find(doc => doc.document_type === `${documentType}_documents`);
                      return (
                        <tr key={documentType}>
                          <td>{documentTypes[documentType]}</td>
                          <td className="status-cell">
                            {document ? (
                              <span className={`status-${document.status.toLowerCase()}`}>
                                <FontAwesomeIcon 
                                  icon={document.status === 'Approved' ? faCheckCircle : faClock} 
                                  className="status-icon" 
                                />
                                {document.status === 'Approved' ? 'Submitted' : document.status}
                              </span>
                            ) : (
                              <span className="status-pending">Not submitted yet</span>
                            )}
                          </td>
                          <td>
                            {document ? (
                              <button 
                                className="btn view-btn"
                                onClick={() => window.open(document.file_url, '_blank')}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                            ) : (
                              <label className="btn upload-btn">
                                <i className="fas fa-upload"></i> Upload
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleDocumentChange(e, documentType)}
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
            <>
              {!isRenewalStatus && user?.status !== 'Declined' && (
                <div className="profile-tabsuser">
                  {user?.status !== 'Terminated' && user?.status !== 'Pending Remarks' && (
                    <button 
                      className={`tab-buttonuser ${activeTab === 'personal' ? 'active' : ''}`}
                      onClick={() => setActiveTab('personal')}
                      disabled={hasRestrictedAccess()}
                    >
                      Personal Information
                    </button>
                  )}
                  {user?.status !== 'Terminated' && user?.status !== 'Pending Remarks' && (
                    <button 
                      className={`tab-buttonuser ${activeTab === 'documents' ? 'active' : ''}`}
                      onClick={() => setActiveTab('documents')}
                    >
                      Documents
                    </button>
                  )}
                  {user?.status === 'Verified' && (
                    <button 
                      className={`tab-buttonuser ${activeTab === 'cardId' ? 'active' : ''}`}
                      onClick={() => setActiveTab('cardId')}
                    >
                      Card ID
                    </button>
                  )}
                </div>
              )}

              <div className="content-grid">
                {isRenewalStatus ? (
                  <div className="documents-section-user">
                    <div className="section-header">
                      <h2>Renewal Application</h2>
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
                              {(() => {
                                const doc = documents.find(doc => doc.document_type === 'barangay_cert_documents');
                                if (doc) {
                                  if (doc.status === 'Approved') {
                                    return (
                                      <span className="status-approved">
                                        <i className="fas fa-check-circle"></i> Submitted
                                      </span>
                                    );
                                  } else if (doc.status === 'Rejected') {
                                    return (
                                      <span className="status-rejected">
                                        <i className="fas fa-times-circle"></i> Rejected
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className={`status-${doc.status.toLowerCase()}`}>
                                        <i className="fas fa-clock"></i> Pending
                                      </span>
                                    );
                                  }
                                } else {
                                  return <span className="status-pending">Not submitted yet</span>;
                                }
                              })()}
                            </td>
                            <td>
                              {(() => {
                                const doc = documents.find(doc => doc.document_type === 'barangay_cert_documents');
                                if (isRenewalStatus) {
                                  return (
                                    <>
                                      {doc && (
                                        <button
                                          className="btn view-btn"
                                          onClick={() => window.open(doc.file_url, '_blank')}
                                          style={{ marginRight: '8px' }}
                                        >
                                          <i className="fas fa-eye"></i> View
                                        </button>
                                      )}
                                      <label className="btn upload-btn">
                                        <i className="fas fa-upload"></i> {doc ? 'Re-upload' : 'Upload'}
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    </>
                                  );
                                } else if (doc) {
                                  if (doc.status === 'Rejected') {
                                    return (
                                      <label className="btn upload-btn">
                                        <i className="fas fa-upload"></i> Re-upload
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    );
                                  } else {
                                    return (
                                      <button 
                                        className="btn view-btn"
                                        onClick={() => window.open(doc.file_url, '_blank')}
                                      >
                                        <i className="fas fa-eye"></i> View
                                      </button>
                                    );
                                  }
                                } else {
                                  return (
                                    <label className="btn upload-btn">
                                      <i className="fas fa-upload"></i> Upload
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleDocumentChange(e, 'barangay_cert')}
                                        style={{ display: 'none' }}
                                      />
                                    </label>
                                  );
                                }
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'personal' && user?.status !== 'Terminated' && user?.status !== 'Pending Remarks' && user?.status !== 'Declined' && (
                      <>
                        <div className="details-section">
                          <div className="section-header">
                            <h3>Personal Information</h3>
                          </div>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">Full Name</span>
                              <p className="detail-value">{user?.first_name} {user?.last_name}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Gender</span>
                              <p className="detail-value">{user?.gender}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Birthdate</span>
                              <p className="detail-value">
                                {user?.date_of_birth ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.date_of_birth)) : ''}
                              </p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Place of Birth</span>
                              <p className="detail-value">{user?.place_of_birth}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Barangay</span>
                              <p className="detail-value">{user?.barangay}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Religion</span>
                              <p className="detail-value">{user?.religion}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Civil Status</span>
                              <p className="detail-value">{user?.civil_status}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Monthly Income</span>
                              <p className="detail-value">
                                {user?.income}
                                {user?.status === 'Verified' && user?.income && (
                                  <span className={`benefit-badge ${
                                    (() => {
                                      let incomeValue = 0;
                                      if (!isNaN(user.income)) {
                                        incomeValue = parseFloat(user.income);
                                      } else {
                                        if (user.income === 'Below ₱10,000') {
                                          incomeValue = 10000;
                                        } else if (user.income === '₱11,000-₱20,000') {
                                          incomeValue = 20000;
                                        } else if (user.income === '₱21,000-₱43,000') {
                                          incomeValue = 43000;
                                        } else if (user.income === '₱44,000 and above') {
                                          incomeValue = 250001;
                                        }
                                      }
                                      return incomeValue < 250001 ? 'eligible' : 'not-eligible';
                                    })()
                                  }`}>
                                    {(() => {
                                      let incomeValue = 0;
                                      if (!isNaN(user.income)) {
                                        incomeValue = parseFloat(user.income);
                                      } else {
                                        if (user.income === 'Below ₱10,000') {
                                          incomeValue = 10000;
                                        } else if (user.income === '₱11,000-₱20,000') {
                                          incomeValue = 20000;
                                        } else if (user.income === '₱21,000-₱43,000') {
                                          incomeValue = 43000;
                                        } else if (user.income === '₱44,000 and above') {
                                          incomeValue = 250001;
                                        }
                                      }
                                      return incomeValue < 250001 ? 'Eligible for Benefits' : 'Not Eligible';
                                    })()}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Contact Number</span>
                              <p className="detail-value">{user?.contact_number}</p>
                            </div>
                          </div>
                        </div>

                        <div className="children-section">
                          <div className="section-header">
                            <h2>Children</h2>
                          </div>
                          <div className="children-list">
                            {user?.familyMembers?.length > 0 ? (
                              <div className="family-members">
                                <div className="family-list">
                                  {user.familyMembers.map((member, index) => (
                                    <div key={index} className="family-member">
                                      <strong>{member.family_member_name}</strong>
                                      <div className="member-details">
                                        <span>Age: {member.age}</span>
                                        <span>Education: {member.educational_attainment}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p>No children information available.</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {activeTab === 'documents' && user?.status !== 'Declined' ? (
                      <div className="documents-section-user">
                        <div className="section-header">
                          <h2>Documents</h2>
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
                              {getDocumentsByCivilStatus(user.civil_status).map((documentType) => {
                                const document = documents.find(doc => doc.document_type === `${documentType}_documents`);
                                return (
                                  <tr key={documentType}>
                                    <td>{documentTypes[documentType]}</td>
                                    <td className="status-cell">
                                      {document ? (
                                        <span className={`status-${document.status.toLowerCase()}`}>
                                          <FontAwesomeIcon 
                                            icon={document.status === 'Submitted' ? faCheckCircle : faClock} 
                                            className="status-icon" 
                                          />
                                          {document.status === 'Approved' ? 'Submitted' : document.status}
                                        </span>
                                      ) : (
                                        <span className="status-pending">Not submitted yet</span>
                                      )}
                                    </td>
                                    <td>
                                      {document ? (
                                        <button 
                                          className="btn view-btn"
                                          onClick={() => window.open(document.file_url, '_blank')}
                                        >
                                          <i className="fas fa-eye"></i> View
                                        </button>
                                      ) : (
                                        <label className="btn upload-btn">
                                          <i className="fas fa-upload"></i> Upload
                                          <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentChange(e, documentType)}
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
                          <div className="mobile-documents-list">
                            {getDocumentsByCivilStatus(user.civil_status).map((documentType) => {
                              const document = documents.find(doc => doc.document_type === `${documentType}_documents`);
                              return (
                                <div className="document-card" key={documentType}>
                                  <div className="document-card-header">
                                    <div className="document-card-type">{documentTypes[documentType]}</div>
                                    <div className="document-card-status">
                                      {document ? 'Submitted' : 'Not submitted'}
                                    </div>
                                  </div>
                                  <div className="document-card-actions">
                                    {document ? (
                                      <button 
                                        className="btn view-btn"
                                        onClick={() => window.open(document.file_url, '_blank')}
                                      >
                                        View
                                      </button>
                                    ) : (
                                      <label className="btn upload-btn">
                                        Upload
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => handleDocumentChange(e, documentType)}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : activeTab === 'cardId' && user?.status === 'Verified' && (
                      <div className="id-cards-container">
                        {/* Front of ID */}
                        <div className="id-card front">
                          <div className="id-card-header">
                            <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                            <div className="id-title">
                              <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                              <h4>Republic of the Philippines</h4>
                              <h4>DSWD Region III</h4>
                            </div>
                          </div>
                          <div className="id-card-body">
                            <div className="id-left-section">
                              <div className="id-photo-container">
                                <img 
                                  src={user?.profilePic || avatar} 
                                  alt="User" 
                                  className="id-photo"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = avatar;
                                  }}
                                />
                              </div>
                              <div className="id-category">
                                Category: {user?.classification}
                              </div>
                              <div className="id-validity">
                                Valid Until: {user?.validUntil }
                              </div>
                            </div>
                            <div className="id-card-container">
                              <div className="id-card-details">
                                <div className="id-detail">
                                  <span className="id-label">ID No:</span>
                                  <span className="id-value">{user?.code_id || 'N/A'}</span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Name:</span>
                                  <span className="id-value">
                                    {`${user?.first_name || ''} ${user?.middle_name || ''} ${user?.last_name || ''}`}
                                  </span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Barangay:</span>
                                  <span className="id-value">{user?.barangay || 'N/A'}</span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Birthdate:</span>
                                  <span className="id-value">
                                    {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Civil Status:</span>
                                  <span className="id-value">{user?.civil_status || 'N/A'}</span>
                                </div>
                                <div className="id-detail">
                                  <span className="id-label">Contact:</span>
                                  <span className="id-value">{user?.contact_number || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="id-card-qr-container">
                                <QRCodeSVG 
                                  value={`user:${user?.userId}`}
                                  size={120}
                                  level="H"
                                  includeMargin={true}
                                  fgColor="#2E7D32"
                                  bgColor="#ffffff"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of ID */}
                        <div className="id-card back">
                          <div className="id-card-header">
                            <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                            <div className="id-title">
                              <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                              <h4>Republic of the Philippines</h4>
                              <h4>DSWD Region III</h4>
                            </div>
                          </div>
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
                            <div className="signature-block">
                              <div className="signature-line"></div>
                              <span>Card Holder's Signature</span>
                            </div>
                            <div className="signature-block">
                              <div className="signature-line"></div>
                              <span>Authorized DSWD Official</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isRenewalStatus && !hasRestrictedAccess() && user?.status !== 'Declined' && (
                  <div className="user-profile-announcements">
                    <div className="profile-announcements-header">
                      <h3>Your Announcements</h3>
                      <p className="profile-announcements-subtitle">Events and updates relevant to you</p>
                    </div>
                    <div className="profile-announcements-list">
                      {(() => {
                        // Helper to parse income value
                        const parseIncome = (income) => {
                          if (!income) return 0;
                          if (!isNaN(income)) return parseFloat(income);
                          if (income === 'Below ₱10,000') return 10000;
                          if (income === '₱11,000-₱20,000') return 20000;
                          if (income === '₱21,000-₱43,000') return 43000;
                          if (income === '₱44,000 and above') return 250001;
                          return 0;
                        };
                        const incomeValue = parseIncome(user?.income);
                        const isEligible = incomeValue < 250001;
                        const filteredEvents = events.filter(event => {
                          if (!event.visibility || event.visibility === 'everyone') return true;
                          if (event.visibility === 'beneficiaries') return isEligible;
                          if (event.visibility === 'not_beneficiaries') return !isEligible;
                          return false;
                        });
                        return filteredEvents.length > 0 ? (
                          filteredEvents.map((event, index) => (
                            <div key={index} className="profile-announcement-card" onClick={() => checkAttendance(event.id)}>
                              <div className="profile-announcement-content">
                                <h4>{event.title}</h4>
                                <p>{event.description}</p>
                                <div className="profile-announcement-meta">
                                  <span>{formatDateTime(event.startDate, event.startTime)}</span>
                                  <span>{event.location}</span>
                                  <span className="profile-announcement-badge">{event.status}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-events-message">No upcoming events</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button onClick={handleDeleteCancelled} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this document?</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={handleDeleteConfirmed} 
                className="delete-button"
              >
                Delete
              </button>
              <button 
                onClick={handleDeleteCancelled} 
                className="cancel-button"
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

// Modal for showing declined info and resend confirmation
function ResendApplicationModal({ onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    setLoading(true);
    const userId = localStorage.getItem('UserId');
    axios.get(`http://localhost:8081/declineInfo?userId=${userId}`, { withCredentials: true })
      .then(res => {
        setInfo(res.data);
        setEditValues({
          ...res.data,
          faceRecognitionPhoto: res.data.faceRecognitionPhoto || '', // always keep in state
          familyMembers: res.data.familyMembers ? res.data.familyMembers.map(fm => ({...fm})) : [],
        });
      })
      .catch(err => setError('Failed to load info'))
      .finally(() => setLoading(false));
  }, []);

  // Handler for starting edit mode
  const startEditAll = () => {
    setIsEditing(true);
  };
  // Handler for canceling edit mode
  const cancelEditAll = () => {
    setIsEditing(false);
    setEditValues({
      ...info,
      familyMembers: info.familyMembers ? info.familyMembers.map(fm => ({...fm})) : [],
    });
  };
  // Handler for saving all edits and submitting to backend
  const saveEditAll = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Prepare the steps data based on editValues
      const step1 = {
        first_name: editValues.first_name,
        middle_name: editValues.middle_name,
        last_name: editValues.last_name,
        age: editValues.age,
        gender: editValues.gender,
        date_of_birth: editValues.date_of_birth,
        place_of_birth: editValues.place_of_birth,
        barangay: editValues.barangay,
        education: editValues.education,
        civil_status: editValues.civil_status,
        occupation: editValues.occupation,
        religion: editValues.religion,
        company: editValues.company,
        income: editValues.income,
        employment_status: editValues.employment_status,
        contact_number: editValues.contact_number,
        pantawid_beneficiary: editValues.pantawid_beneficiary,
        indigenous: editValues.indigenous,
        email: editValues.email
      };
      const step2 = {
        children: (editValues.familyMembers || []).map(fm => {
          // Try to split name if possible, fallback to full string
          let [first_name, ...rest] = (fm.family_member_name || '').split(' ');
          let last_name = rest.pop() || '';
          let middle_name = rest.join(' ');
          return {
            first_name: first_name || '',
            middle_name: middle_name || '',
            last_name: last_name || '',
            age: fm.age,
            educational_attainment: fm.educational_attainment,
            birthdate: fm.birthdate || '',
          };
        })
      };
      const step3 = { classification: editValues.classification };
      const step4 = { needs_problems: editValues.needs_problems };
      const step5 = {
        emergency_name: editValues.emergency_name,
        emergency_relationship: editValues.emergency_relationship,
        emergency_address: editValues.emergency_address,
        emergency_contact: editValues.emergency_contact
      };
      const step6 = {
        faceRecognitionPhoto: editValues.faceRecognitionPhoto || null
      };
      const payload = { step1, step2, step3, step4, step5, step6 };
      const toastId = toast.loading('Saving and resubmitting application...');
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/api/documents/submitAllSteps`, payload, { withCredentials: true });
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success('Application resubmitted successfully!');
        setIsEditing(false);
        setInfo({ ...editValues, familyMembers: editValues.familyMembers ? editValues.familyMembers.map(fm => ({...fm})) : [] });
        if (typeof onClose === 'function') onClose();
      } else {
        toast.error(response.data.message || 'Failed to resubmit application.');
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.error || err.message || 'Error resubmitting application.');
    } finally {
      setLoading(false);
    }
  };
  // Handler for updating family member fields
  const updateFamilyMember = (idx, key, value) => {
    setEditValues(prev => {
      const updated = prev.familyMembers.map((fm, i) => i === idx ? { ...fm, [key]: value } : fm);
      return { ...prev, familyMembers: updated };
    });
  };

  return (
    <>
      <div className="resend-modal">
        <div className="resend-modal-content">
          <div className="resend-modal-header">
            <h2>Resend Application</h2>
            <button className="resend-modal-close" onClick={onClose} title="Close">&times;</button>
          </div>
          <div className="resend-modal-body">
            {loading && <p>Loading...</p>}
            {error && <p style={{color:'red'}}>{error}</p>}
            {info && (
              <>
                <div style={{textAlign: 'right', marginBottom: '10px'}}>
                  {!isEditing ? (
                    <button className="resend-btn" onClick={startEditAll} disabled={loading || isEditing}>Edit</button>
                  ) : (
                    <button className="resend-btn cancel" onClick={cancelEditAll}>Cancel</button>
                  )}
                </div>
                <div className="info-row">
                  <label>Email:</label>
                  <span>{isEditing ? (
                    <input value={editValues.email} onChange={e => setEditValues(v => ({...v, email: e.target.value}))} style={{width: '180px'}} />
                  ) : (
                    info.email
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Status:</label>
                  <span>{info.status}</span>
                </div>
                <div className="info-row">
                  <label>Classification:</label>
                  <span>{isEditing ? (
                    <input value={editValues.classification} onChange={e => setEditValues(v => ({...v, classification: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.classification || 'N/A'
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Gender:</label>
                  <span>{isEditing ? (
                    <input value={editValues.gender} onChange={e => setEditValues(v => ({...v, gender: e.target.value}))} style={{width: '80px'}} />
                  ) : (
                    info.gender
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Date of Birth:</label>
                  <span>{isEditing ? (
                    <input type="date" value={editValues.date_of_birth} onChange={e => setEditValues(v => ({...v, date_of_birth: e.target.value}))} />
                  ) : (
                    info.date_of_birth
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Place of Birth:</label>
                  <span>{isEditing ? (
                    <input value={editValues.place_of_birth} onChange={e => setEditValues(v => ({...v, place_of_birth: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.place_of_birth
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Barangay:</label>
                  <span>{isEditing ? (
                    <input value={editValues.barangay} onChange={e => setEditValues(v => ({...v, barangay: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.barangay
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Education:</label>
                  <span>{isEditing ? (
                    <input value={editValues.education} onChange={e => setEditValues(v => ({...v, education: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.education
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Civil Status:</label>
                  <span>{isEditing ? (
                    <input value={editValues.civil_status} onChange={e => setEditValues(v => ({...v, civil_status: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.civil_status
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Occupation:</label>
                  <span>{isEditing ? (
                    <input value={editValues.occupation} onChange={e => setEditValues(v => ({...v, occupation: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.occupation
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Religion:</label>
                  <span>{isEditing ? (
                    <input value={editValues.religion} onChange={e => setEditValues(v => ({...v, religion: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.religion
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Company:</label>
                  <span>{isEditing ? (
                    <input value={editValues.company} onChange={e => setEditValues(v => ({...v, company: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.company
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Income:</label>
                  <span>{isEditing ? (
                    <input value={editValues.income} onChange={e => setEditValues(v => ({...v, income: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.income
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Employment Status:</label>
                  <span>{isEditing ? (
                    <input value={editValues.employment_status} onChange={e => setEditValues(v => ({...v, employment_status: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.employment_status
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Contact Number:</label>
                  <span>{isEditing ? (
                    <input value={editValues.contact_number} onChange={e => setEditValues(v => ({...v, contact_number: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.contact_number
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Pantawid Beneficiary:</label>
                  <span>{isEditing ? (
                    <select value={editValues.pantawid_beneficiary} onChange={e => setEditValues(v => ({...v, pantawid_beneficiary: e.target.value}))}>
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    info.pantawid_beneficiary ? 'Yes' : 'No'
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Indigenous:</label>
                  <span>{isEditing ? (
                    <select value={editValues.indigenous} onChange={e => setEditValues(v => ({...v, indigenous: e.target.value}))}>
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    info.indigenous ? 'Yes' : 'No'
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Needs/Problems:</label>
                  <span>{isEditing ? (
                    <input value={editValues.needs_problems} onChange={e => setEditValues(v => ({...v, needs_problems: e.target.value}))} style={{width: '120px'}} />
                  ) : (
                    info.needs_problems
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Emergency Contact:</label>
                  <span>{isEditing ? (
                    <>
                      <input value={editValues.emergency_name} onChange={e => setEditValues(v => ({...v, emergency_name: e.target.value}))} style={{width: '100px'}} placeholder="Name" />
                      <input value={editValues.emergency_relationship} onChange={e => setEditValues(v => ({...v, emergency_relationship: e.target.value}))} style={{width: '80px'}} placeholder="Relationship" />
                      <input value={editValues.emergency_address} onChange={e => setEditValues(v => ({...v, emergency_address: e.target.value}))} style={{width: '120px'}} placeholder="Address" />
                      <input value={editValues.emergency_contact} onChange={e => setEditValues(v => ({...v, emergency_contact: e.target.value}))} style={{width: '100px'}} placeholder="Contact" />
                    </>
                  ) : (
                    <>
                      {info.emergency_name} ({info.emergency_relationship})<br/>
                      Address: {info.emergency_address}<br/>
                      Contact: {info.emergency_contact}
                    </>
                  )}</span>
                </div>
                <div className="info-row">
                  <label>Family Members:</label>
                  <span>
                    {(editValues.familyMembers || []).length === 0 ? <span>None</span> : editValues.familyMembers.map((fm, i) => (
                      <div key={i} className="family-row">
                        {isEditing ? (
                          <>
                            <input value={fm.family_member_name} onChange={e => updateFamilyMember(i, 'family_member_name', e.target.value)} style={{width: '120px'}} placeholder="Name" />
                            <input value={fm.age} onChange={e => updateFamilyMember(i, 'age', e.target.value)} style={{width: '60px'}} placeholder="Age" />
                            <input value={fm.educational_attainment} onChange={e => updateFamilyMember(i, 'educational_attainment', e.target.value)} style={{width: '120px'}} placeholder="Education" />
                          </>
                        ) : (
                          <>
                            {fm.family_member_name} ({fm.age} yrs, {fm.educational_attainment})
                          </>
                        )}
                      </div>
                    ))}
                  </span>
                </div>
                <input type="hidden" name="faceRecognitionPhoto" value={editValues.faceRecognitionPhoto || ''} />
                <div className="info-row">
                  <label>Documents:</label>
                  <span>
                    {(info.documents || []).length === 0 ? <span>None</span> : info.documents.map((doc, i) => (
                      <div key={i} className="document-row">
                        {doc.display_name} - <a href={doc.file_url} target="_blank" rel="noopener noreferrer">View</a> ({doc.status})
                      </div>
                    ))}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="resend-modal-footer">
            <button
              className="resend-btn save"
              style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '1.05rem', padding: '10px 26px', borderRadius: '7px' }}
              onClick={saveEditAll}
              disabled={loading || (isEditing && loading)}
            >
              {isEditing ? (loading ? 'Saving...' : 'Confirm') : 'Confirm'}
            </button>
            <button
              className="resend-btn cancel"
              onClick={onClose}
              style={{ marginLeft: '8px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
