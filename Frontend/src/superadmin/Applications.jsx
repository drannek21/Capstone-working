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

  // New state for classification dropdown
  const [classificationOptions] = useState([
    { code: "001", label: "Birth due to rape" },
    { code: "002", label: "Death of spouse" },
    { code: "003", label: "Detention of spouse" },
    { code: "004", label: "Spouse's incapacity" },
    { code: "005", label: "Legal separation" },
    { code: "006", label: "Annulled marriage" },
    { code: "007", label: "Abandoned by spouse" },
    { code: "008", label: "OFW's family member" },
    { code: "009", label: "Unmarried parent" },
    { code: "010", label: "Legal guardian" },
    { code: "011", label: "Relative caring for child" },
    { code: "012", label: "Pregnant woman solo caregiver" },
  ]);
  const [selectedClassification, setSelectedClassification] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
      
      // Check if documents are included in the response
      if (response.data.length > 0) {
        console.log('Sample documents data:', response.data[0].documents || 'No documents');
      }
      
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
    if (application.classification && !/^(00[1-9]|0[1-9][0-9]|1[01][0-2])$/.test(application.classification)) {
      setShowDropdown(true); // Show dropdown if classification is not a valid number
    } else {
      setShowDropdown(false);
    }
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
  
      // Log to verify the correct email is being sent
      console.log('User email:', selectedApplication.email);
  
      const response = await axios.post('http://localhost:8081/updateUserStatus', {
        code_id: selectedApplication.code_id, // Ensure this matches the backend
        status: action === "Accept" ? "Created" : "Declined",
        remarks: remarks.trim() || "No remarks provided",
        email: selectedApplication.email,
        firstName: selectedApplication.first_name,
        action: action,
      });
  
      if (response.status === 200) {
        // Show success message
        const message = action === "Accept" 
          ? "Application accepted and email notification sent!" 
          : "Application declined and email notification sent!";
        alert(message);
        
        // Refresh the applications list
        await fetchApplications();
        
        // Close modal and reset state
        closeModal();
        setRemarks("");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      alert(`Error updating application status: ${errorMessage}. Please try again.`);
    }
  };

  const handleClassificationUpdate = async () => {
    if (selectedClassification) {
      console.log('Sending code_id:', selectedApplication.code_id); // Log the code_id
      try {
        const response = await axios.post('http://localhost:8081/pendingUsers/updateClassification', {
          code_id: selectedApplication.code_id,
          classification: selectedClassification,
        });
        if (response.status === 200) {
          alert('Classification updated successfully!');
          // Update the selected application classification directly
          setSelectedApplication(prev => ({ ...prev, classification: selectedClassification }));
        }
      } catch (error) {
        console.error('Error updating classification:', error);
        alert('Error updating classification. Please try again.');
      }
    } else {
      alert('Please select a classification.');
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
      if (deltaX > 0 && stepPage < 6) {
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
                <td>
                  <div className="action-buttons">
                    <button className="btn view-btn" onClick={() => openModal(app, "view")}> 
                      <i className="fas fa-eye"></i> View
                    </button>
                    <button className="btn accept-btnsadmin" onClick={() => openModal(app, "confirmAccept")}> 
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button className="btn decline-btnsadmin" onClick={() => openModal(app, "decline")}> 
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
              <h3>Application Details (Step {stepPage}/6)</h3>
            </div>
            <div className="modal-content">
              {/* Add step indicators for mobile */}
              <div className="step-indicators">
                {[1, 2, 3, 4, 5, 6].map(step => (
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
                      <span className="label">Barangay</span>
                      <span className="value">{selectedApplication.barangay}</span>
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
                  <h4>Family Information</h4>
                  {selectedApplication.familyMembers && selectedApplication.familyMembers.length > 0 ? (
                    <div className="children-list">
                      {selectedApplication.familyMembers.map((member, index) => (
                        <div key={index} className="child-details">
                          <h5>Family Member {index + 1}</h5>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="label">Name</span>
                              <span className="value">{member.family_member_name}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Birthdate</span>
                              <span className="value">{formatDate(member.birthdate)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Age</span>
                              <span className="value">{member.age}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Educational Attainment</span>
                              <span className="value">{member.educational_attainment}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No family members information available.</p>
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
                  <div className="classification-input">
                    {showDropdown && (
                      <select 
                        onChange={(e) => setSelectedClassification(e.target.value)}
                        className="classification-dropdown"
                      >
                        <option value="">Select Classification</option>
                        {classificationOptions.map(option => (
                          <option key={option.code} value={option.code} className="dropdown-option">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <button className="btn accept-btn" onClick={handleClassificationUpdate} style={{ display: showDropdown ? 'block' : 'none' }}>
                      <i className="fas fa-check"></i> Update Classification
                    </button>
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
              {stepPage === 6 && (
                <div className="detail-section">
                  <h4>Documents</h4>
                  {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                    <div className="documents-list">
                      {selectedApplication.documents.map((doc, index) => {
                        // Extract document type from table name
                        const displayType = doc.document_type ? 
                          doc.document_type.replace('_documents', '').toUpperCase() : 'Document';
                        
                        return (
                          <div key={index} className="document-item">
                            <div className="document-header">
                              <h5>{displayType}</h5>
                            </div>
                            <div className="document-preview">
                              <img 
                                src={doc.file_url} 
                                alt={doc.display_name || displayType}
                                className="document-thumbnail"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Image+Not+Found";
                                }}
                              />
                            </div>
                            <div className="document-actions">
                              <button 
                                className="btn view-btn full-width"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <i className="fas fa-eye"></i> View Full Size
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p>No documents available.</p>
                  )}
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
                {stepPage < 6 ? (
                  <button 
                    className="accept-mobile-nav-btn"
                    onClick={() => setStepPage(stepPage + 1)}
                  >
                    Next <i className="fas fa-arrow-right"></i>
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn-accept-btnsadmin"
                      onClick={() => handleAction("Accept")}
                    >
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button 
                      className="btn decline-btnsadmin"
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
              <button className="btn-accept-btnsadmin" onClick={() => handleAction("Accept")}>
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
              <button className="btn decline-btnsadmin" onClick={() => handleAction("Decline")}>
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
