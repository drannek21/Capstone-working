import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Applications.css';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [modalType, setModalType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10); // Show 10 entries per page
  const [stepPage, setStepPage] = useState(1); // Pagination for steps
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    fetchApplications();
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, []);

  const checkTableScroll = () => {
    if (tableContainerRef.current) {
      const { scrollWidth, clientWidth } = tableContainerRef.current;
      setIsTableScrollable(scrollWidth > clientWidth);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:8081/pendingUsers');
      
      // Log the response to check data structure
      console.log('Fetched Applications:', response.data);
      
      // Ensure each application has the correct userId field
      const formattedData = response.data.map(app => {
        // Make sure we keep the userId from the database response
        return {
          ...app,
          userId: app.userId, // Keep the original userId from the database
        };
      });
      
      setApplications(formattedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Error fetching applications. Please refresh the page.');
    }
  };

  const openModal = (application, type) => {
    setSelectedApplication(application);
    setStepPage(1);
    setRemarks("");
    setModalType(type);
    // Don't prevent scroll on mobile as it might cause issues
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setRemarks("");
    setModalType("");
    document.body.style.overflow = 'auto';
  };

  const handleAction = async (action) => {
    if (!selectedApplication) return;
    
    try {
      // For decline action, check if remarks are provided
      if (action === "Decline" && !remarks.trim()) {
        alert("Please provide remarks for declining.");
        return;
      }

      // Log the selected application and action details
      console.log('Processing action:', {
        action,
        selectedApplication,
        remarks: remarks.trim()
      });

      const response = await axios.post('http://localhost:8081/updateUserStatus', {
        userId: selectedApplication.userId,
        status: action === "Accept" ? "Verified" : "Declined",
        remarks: remarks.trim() || "No remarks provided" // Ensure remarks are sent even for Accept action
      });

      if (response.status === 200) {
        // Show success message
        const message = action === "Accept" 
          ? "Application accepted successfully!" 
          : "Application declined successfully!";
        alert(message);
        
        // Refresh the applications list
        await fetchApplications();
        
        // Close modal and reset state
        closeModal();
        setRemarks("");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // More detailed error message
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      alert(`Error updating application status: ${errorMessage}. Please try again.`);
    }
  };
  
  const filteredApplications = applications.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (app.id && app.id.toString().includes(searchLower)) ||
      (app.code_id && app.code_id.toLowerCase().includes(searchLower)) ||
      (app.first_name && app.first_name.toLowerCase().includes(searchLower)) ||
      (app.email && app.email.toLowerCase().includes(searchLower)) ||
      (app.age && app.age.toString().includes(searchLower))
    );
  });

  // Calculate the index of the first and last application to show based on pagination
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add touch event handlers for mobile swipe
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;

    // If horizontal swipe is greater than vertical and more than 50px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && stepPage < 5) {
        setStepPage(prev => prev + 1);
      } else if (deltaX < 0 && stepPage > 1) {
        setStepPage(prev => prev - 1);
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h2>Applications Details</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div 
        ref={tableContainerRef}
        className={`table-container ${isTableScrollable ? 'has-scroll' : ''}`}
      >
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Code ID</th>
              <th>Name</th>
              <th>Barangay</th>
              <th>Email</th>
              <th>Age</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentApplications.map((app, index) => (
              <tr key={index}>
                <td>{indexOfFirstApplication + index + 1}</td>
                <td>{app.code_id}</td>
                <td>{`${app.first_name} ${app.middle_name || ''} ${app.last_name}`}</td>
                <td>{app.barangay || 'N/A'}</td>
                <td>{app.email}</td>
                <td>{app.age}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn view-btn" onClick={() => openModal(app, "view")}>
                      <i className="fas fa-eye"></i> View
                    </button>
                    <button className="btn accept-btn" onClick={() => openModal(app, "confirmAccept")}>
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button className="btn decline-btn" onClick={() => openModal(app, "decline")}>
                      <i className="fas fa-times"></i> Decline
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button 
          className="page-btn" 
          onClick={() => setCurrentPage(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button 
          className="page-btn" 
          onClick={() => setCurrentPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* PAGINATED VIEW DETAILS MODAL */}
      {modalType === "view" && selectedApplication && (
        <div 
          className="modal-overlay" 
          onClick={closeModal}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Application Details (Step {stepPage}/5)</h3>
            </div>
            <div className="modal-content">
              {/* Add step indicators for mobile */}
              <div className="step-indicators">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`step-dot ${stepPage === step ? 'active' : ''}`}
                    onClick={() => setStepPage(step)}
                  />
                ))}
              </div>
              
              {stepPage === 1 && (
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedApplication.first_name || ''} ${selectedApplication.middle_name || ''} ${selectedApplication.last_name || ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Age</span>
                      <span className="value">{selectedApplication.age || ''}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Gender</span>
                      <span className="value">{selectedApplication.gender || ''}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date of Birth</span>
                      <span className="value">{formatDate(selectedApplication.date_of_birth)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Place of Birth</span>
                      <span className="value">{selectedApplication.place_of_birth}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Address</span>
                      <span className="value">{selectedApplication.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email</span>
                      <span className="value">{selectedApplication.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Contact Number</span>
                      <span className="value">{selectedApplication.contact_number}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Education</span>
                      <span className="value">{selectedApplication.education}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Occupation</span>
                      <span className="value">{selectedApplication.occupation}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Company</span>
                      <span className="value">{selectedApplication.company}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Income</span>
                      <span className="value">{selectedApplication.income}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Employment Status</span>
                      <span className="value">{selectedApplication.employment_status}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Civil Status</span>
                      <span className="value">{selectedApplication.civil_status}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Religion</span>
                      <span className="value">{selectedApplication.religion}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Pantawid Beneficiary</span>
                      <span className="value">{selectedApplication.pantawid_beneficiary}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Indigenous</span>
                      <span className="value">{selectedApplication.indigenous}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedApplication.code_id}</span>
                    </div>
                  </div>
                </div>
              )}

              {stepPage === 2 && (
                <div className="detail-section">
                  <h4>Family Information (Children)</h4>
                  {selectedApplication.children && selectedApplication.children.length > 0 ? (
                    <div className="children-list">
                      {selectedApplication.children.map((child, index) => (
                        <div key={index} className="child-details">
                          <h5>Child {index + 1}</h5>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="label">Name</span>
                              <span className="value">
                                {`${child.first_name || ''} ${child.middle_name || ''} ${child.last_name || ''}`}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Birthdate</span>
                              <span className="value">{formatDate(child.birthdate)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Age</span>
                              <span className="value">{child.age}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Education</span>
                              <span className="value">{child.educational_attainment}</span>
                            </div>
                          </div>
                          {index < selectedApplication.children.length - 1 && <hr />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No children information available.</p>
                  )}
                </div>
              )}

              {stepPage === 3 && (
                <div className="detail-section">
                  <h4>Classification</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Type</span>
                      <span className="value">{selectedApplication.classification}</span>
                    </div>
                  </div>
                </div>
              )}

              {stepPage === 4 && (
                <div className="detail-section">
                  <h4>Needs/Problems</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Details</span>
                      <span className="value">{selectedApplication.needs_problems}</span>
                    </div>
                  </div>
                </div>
              )}

              {stepPage === 5 && (
                <div className="detail-section">
                  <h4>Emergency Contact</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">{selectedApplication.emergency_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Relationship</span>
                      <span className="value">{selectedApplication.emergency_relationship}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Address</span>
                      <span className="value">{selectedApplication.emergency_address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Contact Number</span>
                      <span className="value">{selectedApplication.emergency_contact}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-friendly footer */}
            <div className="modal-footer">
              <div className="modal-footer-left">
                {stepPage > 1 && (
                  <button 
                    className="btn view-btn mobile-nav-btn"
                    onClick={() => setStepPage(stepPage - 1)}
                  >
                    <i className="fas fa-arrow-left"></i> Previous
                  </button>
                )}
              </div>
              <div className="modal-footer-right">
                {stepPage < 5 ? (
                  <button 
                    className="btn accept-btn mobile-nav-btn"
                    onClick={() => setStepPage(stepPage + 1)}
                  >
                    Next <i className="fas fa-arrow-right"></i>
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn accept-btn"
                      onClick={() => handleAction("Accept")}
                    >
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button 
                      className="btn decline-btn"
                      onClick={() => handleAction("Decline")}
                    >
                      <i className="fas fa-times"></i> Decline
                    </button>
                  </>
                )}
                <button className="btn view-btn" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === "confirmAccept" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Acceptance</h3>
            </div>
            <div className="modal-content">
              <p className="confirmation-message">Are you sure you want to accept this application?</p>
            </div>
            <div className="modal-footer">
              <button className="btn accept-btn" onClick={() => handleAction("Accept")}>
                <i className="fas fa-check"></i> Yes, Accept
              </button>
              <button className="btn view-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {modalType === "decline" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Decline Application</h3>
            </div>
            <div className="modal-content">
              <div className="remarks-section">
                <label>Please provide remarks for declining:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks here"
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn decline-btn" onClick={() => handleAction("Decline")}>
                <i className="fas fa-times"></i> Confirm Decline
              </button>
              <button className="btn view-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
