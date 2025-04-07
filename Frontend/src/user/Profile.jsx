import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faTimes,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import avatar from '../assets/avatar.jpg';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('details');
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

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
  const CLOUD_NAME = 'dskj7oxr7';
  const UPLOAD_PRESET = 'soloparent';
  const CLOUDINARY_FOLDER = 'soloparent/users';

  // Fetch user details
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
  }, [loggedInUserId, API_BASE_URL]);

  // Handle profile picture upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setShowUploadModal(true);
    }
  };

  const handleUploadProfilePic = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', CLOUDINARY_FOLDER);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();
      if (cloudinaryData.secure_url) {
        const response = await fetch(`${API_BASE_URL}/updateProfilePic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUserId,
            profilePic: cloudinaryData.secure_url,
          }),
        });

        if (response.ok) {
          setUser(prev => ({ ...prev, profilePic: cloudinaryData.secure_url }));
          localStorage.setItem(`profilePic_${loggedInUserId}`, cloudinaryData.secure_url);
          toast.success('Profile picture updated successfully!');
          setShowUploadModal(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        } else {
          throw new Error('Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

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

  return (
    <div className="profile-container">
      <Toaster position="top-right" />
      <div className="dashboard-main">
        <div className="profile-header">
          <div className="profile-cover">
            <div className="profile-info">
              <div className="profile-pic-container">
                <img 
                  src={user?.profilePic || avatar} 
                  alt={user?.first_name || 'Profile'} 
                  className="profile-pic" 
                />
                <label className="edit-profile-pic" aria-label="Edit profile picture">
                  <FontAwesomeIcon icon={faCamera} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div className="profile-text">
                <h1>{user ? `${user.first_name} ${user.last_name}` : 'Loading...'}</h1>
                <p className="user-email">{user?.email || 'Loading...'}</p>
                <div className="profile-tags">
                  <span className={`tag ${user?.status?.toLowerCase()}-tag`}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    {user?.status || 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Update Profile Picture</h2>
                <button onClick={() => setShowUploadModal(false)} className="close-button">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                )}
              </div>
              <div className="modal-footer">
                <button 
                  onClick={handleUploadProfilePic} 
                  className="upload-button"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }} 
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-content">
          <div className="content-grid">
            {/* Minimalist Details Section */}
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
                        parseInt(user.income.replace(/[^0-9]/g, '')) < 250000 ? 'eligible' : 'not-eligible'
                      }`}>
                        {parseInt(user.income.replace(/[^0-9]/g, '')) < 250000 ? 'Eligible for Benefits' : 'Not Eligible'}
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
              {user?.familyMembers?.length > 0 && (
                  <div className="detail-item family-members">
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
                )}
              </div>
            </div>

            <div className="announcements-section">
              <div className="section-header">
                <h2>Announcements</h2>
              </div>
              <div className="announcements-list">
                {[
                  {
                    title: "System Update", 
                    content: "New features coming next week!", 
                    date: "2 days ago",
                    type: "update"
                  },
                  {
                    title: "Holiday Schedule", 
                    content: "Check the updated holiday calendar", 
                    date: "5 days ago",
                    type: "event"
                  },
                  {
                    title: "Community Event", 
                    content: "Join us for the monthly parent meetup", 
                    date: "1 week ago",
                    type: "community"
                  }
                ].map((announcement, index) => (
                  <div className={`announcement-item ${announcement.type}`} key={index}>
                    <div className="announcement-content">
                      <h4>{announcement.title}</h4>
                      <p>{announcement.content}</p>
                    </div>
                    <span className="announcement-date">{announcement.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Profile;
