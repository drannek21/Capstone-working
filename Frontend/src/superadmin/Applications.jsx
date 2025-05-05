import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import SuperAdminSideBar from './SuperAdminSideBar';
import './Applications.css';

const Applications = () => {
  const location = useLocation();
  // Tab state: 'regular' or 'follow_up'
  const [activeTab, setActiveTab] = useState('regular');
  // ...existing state
  const [documentActionStatus, setDocumentActionStatus] = useState({}); // { [docIndex]: 'Accepted' | 'Declined' | undefined }

  const [applications, setApplications] = useState([]);
  const [missingDocuments, setMissingDocuments] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [remarks, setRemarks] = useState("");
const [acceptAllLoading, setAcceptAllLoading] = useState(false);
  const [modalType, setModalType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10); // Show 10 entries per page
  const [stepPage, setStepPage] = useState(1); // Pagination for steps
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const tableContainerRef = useRef(null);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

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
    if (modalType === "followup") {
      fetchMissingDocuments();
    } else {
      fetchApplications();
    }
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, [modalType]);

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

  const fetchMissingDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:8081/api/documents/follow_up_documents');
      // Group documents by code_id
      const groupedDocuments = response.data.reduce((acc, doc) => {
        if (!acc[doc.code_id]) {
          acc[doc.code_id] = {
            id: doc.id,
            code_id: doc.code_id,
            documents: []
          };
        }
        acc[doc.code_id].documents.push({
          document_type: doc.document_type, // comes from backend SQL alias
          file_name: doc.file_name,         // ensure this is included for update
          status: doc.status,
          follow_up_date: doc.follow_up_date,
          file_url: doc.file_url,
          display_name: doc.display_name
        });
        return acc;
      }, {});
      
      // Convert to array
      const documentsList = Object.values(groupedDocuments);
      setMissingDocuments(documentsList);
    } catch (error) {
      console.error('Error fetching missing documents:', error);
      alert('Error fetching missing documents. Please refresh the page.');
    }
  };

  const openModal = (application, type) => {
    setSelectedApplication(application);
    setStepPage(1);
    setRemarks("");
    
    // Handle modal type based on current context
    if (modalType === "followup") {
      // For follow-up documents, use specific modal types
      if (type === "confirmAccept") {
        setModalType("followupConfirmAccept");
      } else if (type === "decline") {
        setModalType("followupDecline");
      } else if (type === "viewDocuments") {
        setModalType("followupViewDocuments");
      }
    } else {
      setModalType(type);
    }

    if (application.classification && !/^(00[1-9]|0[1-9][0-9]|1[01][0-2])$/.test(application.classification)) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setSelectedFollowup(null);
    setDocumentActionStatus({});
    setRemarks("");
    
    // Handle modal type based on current context
    if (modalType === "followupConfirmAccept" || 
        modalType === "followupDecline" || 
        modalType === "followupViewDocuments") {
      setModalType("followup");
    } else {
      setModalType("");
    }
    
    document.body.style.overflow = 'auto';
  };

  const handleAction = async (action) => {
    if (!selectedApplication) return;
    
    try {
      if (action === "Decline" && !remarks.trim()) {
        alert("Please provide remarks for declining.");
        return;
      }
  
      console.log('User email:', selectedApplication.email);
  
      const response = await axios.post('http://localhost:8081/updateUserStatus', {
        code_id: selectedApplication.code_id,
        status: action === "Accept" ? "Created" : "Declined",
        remarks: remarks.trim() || "No remarks provided",
        email: selectedApplication.email,
        firstName: selectedApplication.first_name,
        action: action,
        updateDocumentStatus: action === "Accept" ? true : false,
        documentType: selectedApplication.document_type,
        documentStatus: action === "Accept" ? "Approved" : "Declined"
      });
  
      if (response.status === 200) {
        const message = action === "Accept" 
          ? "Application accepted and email notification sent! Documents status updated to Approved." 
          : "Application declined and email notification sent!";
        
        if (action === "Accept") {
          const tempApplication = { ...selectedApplication }; // Store application data
          alert(message);
          await fetchApplications();
          setRemarks("");
          closeModal();
          setSelectedApplication(tempApplication); // Restore application data
          setShowBeneficiaryModal(true);
        } else {
          alert(message);
          await fetchApplications();
          setRemarks("");
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      alert(`Error updating application status: ${errorMessage}. Please try again.`);
    }
  };
  const handleBeneficiaryStatus = async (status) => {
    try {
      if (!selectedApplication || !selectedApplication.code_id) {
        alert('Error: Application data is missing');
        return;
      }

      const response = await axios.post('http://localhost:8081/update-beneficiary-status', {
        code_id: selectedApplication.code_id,
        status: status
      });
  
      if (response.data.success) {
        setShowBeneficiaryModal(false);
        alert('Application accepted and beneficiary status updated successfully!');
        await fetchApplications(); // Refresh the applications list
      } else {
        throw new Error(response.data.error || 'Failed to update beneficiary status');
      }
    } catch (error) {
      console.error('Error updating beneficiary status:', error);
      alert(`Error updating beneficiary status: ${error.response?.data?.error || error.message}`);
    }
  };
  // Accept All Follow-up Documents
  const handleAcceptAllFollowups = async () => {
    if (!selectedApplication || !selectedApplication.documents) return;
    const docsToAccept = selectedApplication.documents.filter(doc => doc.status !== 'Approved');
    if (docsToAccept.length === 0) {
      alert('All documents are already approved.');
      return;
    }
    setAcceptAllLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const doc of docsToAccept) {
      try {
        const response = await axios.post('http://localhost:8081/updateDocumentStatus', {
          document_type: doc.document_type,
          file_name: doc.file_name,
          status: 'Approved',
          rejection_reason: ''
        });
        if (response.status === 200) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error approving document:', doc, error);
        failCount++;
      }
    }
    await fetchMissingDocuments();
    setAcceptAllLoading(false);
    closeModal();
    alert(`Accepted ${successCount} document(s). ${failCount > 0 ? failCount + ' failed.' : ''}`);
  };

  // New function for handling follow-up document actions
  const handleFollowupAction = async (action) => {
    if (!selectedFollowup) return;

    // Debug: log selectedFollowup
    console.log('selectedFollowup in handleFollowupAction:', selectedFollowup);

    // Ensure required fields are present
    const { document_type, file_name } = selectedFollowup;
    if (!document_type || !file_name) {
      alert('Error: Missing document_type or file_name');
      return;
    }

    try {
      // For decline action, check if remarks are provided
      if (action === "Decline" && !remarks.trim()) {
        alert("Please provide remarks for declining.");
        return;
      }

      const status = action === "Accept" ? "Approved" : "Declined";
      const rejection_reason = remarks.trim() || "No remarks provided";

      console.log('Sending request with:', {
        document_type,
        file_name,
        status,
        rejection_reason
      });

      const response = await axios.post('http://localhost:8081/updateDocumentStatus', {
        document_type,
        file_name,
        status,
        rejection_reason
      });

      if (response.status === 200) {
        alert(action === "Accept" ? "Document accepted successfully!" : "Document declined successfully!");
        await fetchMissingDocuments();
        closeModal();
        setRemarks("");
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
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

  const filteredApplications = modalType === "followup" 
    ? missingDocuments.filter(doc => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (doc.id && doc.id.toString().includes(searchLower)) ||
          (doc.code_id && doc.code_id.toLowerCase().includes(searchLower))
        );
      })
    : applications.filter(app => {
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
    <div className="super-admin-content">
      <div className="applications-header">
        <h1 className="section-title">Applications</h1>
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
      <div className="tabs-container">
        <button 
          className={`tab-button ${modalType === "" ? 'active' : ''}`}
          onClick={() => setModalType("")}
        >
          Regular Applications
        </button>
        <button 
          className={`tab-button ${modalType === "followup" ? 'active' : ''}`}
          onClick={() => setModalType("followup")}
        >
          Follow-up Documents
        </button>
      </div>

      <div 
        ref={tableContainerRef}
        className={`table-container ${isTableScrollable ? 'has-scroll' : ''}`}
      >
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {modalType === "" ? (
                <>
                  <th>Code ID</th>
                  <th>Name</th>
                  <th>Barangay</th>
                </>
              ) : (
                <th>Code ID</th>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentApplications.map((item, index) => (
              <tr key={index}>
                <td>{indexOfFirstApplication + index + 1}</td>
                {modalType === "" ? (
                  <>
                    <td>{item.code_id}</td>
                    <td>{`${item.first_name || ''} ${item.middle_name || ''} ${item.last_name || ''}${item.suffix && item.suffix !== 'none' ? ` ${item.suffix}` : ''}`}</td>
                    <td>{item.barangay || 'N/A'}</td>
                  </>
                ) : (
                  <td>{item.code_id}</td>
                )}
                <td>
                  {modalType === "" ? (
                    <>
                      <button className="btn view-btn" onClick={() => openModal(item, "view")}> 
                        <i className="fas fa-eye"></i> View
                      </button>
                      <button className="btn accept-btnsadmin" onClick={() => openModal(item, "confirmAccept")}> 
                        <i className="fas fa-check"></i> Accept
                      </button>
                      <button className="btn decline-btnsadmin" onClick={() => openModal(item, "decline")}> 
                        <i className="fas fa-times"></i> Decline
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn view-btn" onClick={() => openModal(item, "viewDocuments")}> 
                        <i className="fas fa-eye"></i> View Documents
                      </button>
                    </>
                  )}
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
          className="application-view-modal-overlay" 
          onClick={closeModal}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="application-view-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="application-view-modal-header">
              <h3>Application Details (Step {stepPage}/6)</h3>
            </div>
            <div className="application-view-modal-content">
              {/* Add step indicators for mobile */}
              <div className="application-step-indicators">
                {[1, 2, 3, 4, 5, 6].map(step => (
                  <div
                    key={step}
                    className={`application-step-dot ${stepPage === step ? 'active' : ''}`}
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
                        {`${selectedApplication.first_name || ''} ${selectedApplication.middle_name || ''} ${selectedApplication.last_name || ''}${selectedApplication.suffix && selectedApplication.suffix !== 'none' ? ` ${selectedApplication.suffix}` : ''}`}
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
                  {selectedApplication && selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                    <div className="application-documents-list">
                      {selectedApplication.documents.map((doc, index) => {
                        // Extract document type from table name
                        const displayType = doc.document_type ? 
                          doc.document_type.replace('_documents', '').toUpperCase() : 'Document';
                        
                        return (
                          <div key={index} className="application-document-item">
                            <div className="application-document-header">
                              <h5>{displayType}</h5>
                            </div>
                            <div className="application-document-preview">
                              <img 
                                src={doc.file_url} 
                                alt={doc.display_name || displayType}
                                className="application-document-thumbnail"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Image+Not+Found";
                                }}
                              />
                            </div>
                            <div className="application-document-actions">
                              <button 
                                className="application-btn-view full-width"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <i className="fas fa-eye"></i> View Full Size
                              </button>
                              {/* Accept/Decline buttons for each document */}
                              <button 
                                className="application-btn-accept"
                                onClick={async () => {
                                  setSelectedFollowup(doc);
                                  setModalType("followupConfirmAccept");
                                }}
                              >
                                <i className="fas fa-check"></i> Accept
                              </button>
                              <button 
                                className="application-btn-decline"
                                onClick={async () => {
                                  setSelectedFollowup(doc);
                                  setModalType("followupDecline");
                                }}
                              >
                                <i className="fas fa-times"></i> Decline
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
        <div className="confirm-accept-modal-overlay" onClick={closeModal}>
          <div className="confirm-accept-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-accept-modal-header">
              <h3>Confirm Acceptance</h3>
            </div>
            <div className="confirm-accept-modal-content">
              <p className="confirmation-message">Are you sure you want to accept this application?</p>
            </div>
            <div className="confirm-accept-modal-footer">
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
        <div className="decline-modal-overlay" onClick={closeModal}>
          <div className="decline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="decline-modal-header">
              <h3>Decline Application</h3>
            </div>
            <div className="decline-modal-content">
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
            <div className="decline-modal-footer">
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

      {/* Follow-up Documents View Modal */}
      {modalType === "followupViewDocuments" && selectedApplication && (
        <div className="followup-modal-overlay" onClick={closeModal}>
          <div className="followup-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="followup-modal-header">
              <h3>Follow-up Documents</h3>
            </div>
            <div className="followup-modal-content">
              <div className="followup-detail-section">
                <h4>Documents</h4>
                <button className="followup-btn-accept" style={{marginBottom: '10px'}} onClick={handleAcceptAllFollowups} disabled={acceptAllLoading}>
  {acceptAllLoading ? (
    <span><i className="fas fa-spinner fa-spin"></i> Accepting All...</span>
  ) : (
    <span><i className="fas fa-check-double"></i> Accept All</span>
  )}
</button>
                {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                  <div className="followup-documents-list">
                    {selectedApplication.documents.map((doc, index) => {
                      const displayType = doc.document_type ? 
                        doc.document_type.replace('_documents', '').toUpperCase() : 'Document';
                      const actionStatus = documentActionStatus[index];
                      return (
                        <div key={index} className="followup-document-item">
                          <div className="followup-document-header">
                            <h5>{displayType}</h5>
                            <span className={`followup-status-${doc.status.toLowerCase()}`}>
                              {doc.status}
                            </span>
                          </div>
                          {doc.file_url ? (
                            <>
                              <div className="followup-document-preview">
                                <img 
                                  src={doc.file_url} 
                                  alt={doc.display_name || displayType}
                                  className="followup-document-thumbnail"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Image+Not+Found";
                                  }}
                                />
                              </div>
                              <div className="followup-document-actions">
                                <button 
                                  className="followup-btn-view full-width"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <i className="fas fa-eye"></i> View Full Size
                                </button>
                              </div>
                              {/* Accept/Decline controls per document */}
                              <div className="followup-document-action-buttons" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                <button
                                  className="followup-btn-accept"
                                  disabled={!!actionStatus}
                                  onClick={async () => {
                                    setSelectedFollowup(doc);
                                    setModalType("followupConfirmAccept");
                                  }}
                                >
                                  <i className="fas fa-check"></i> Accept
                                </button>
                                <button
                                  className="followup-btn-decline"
                                  disabled={!!actionStatus}
                                  onClick={async () => {
                                    setSelectedFollowup(doc);
                                    setModalType("followupDecline");
                                  }}
                                >
                                  <i className="fas fa-times"></i> Decline
                                </button>
                                {actionStatus && (
                                  <span style={{ marginLeft: '10px', fontWeight: 'bold', color: actionStatus === 'Accepted' ? 'green' : 'red' }}>
                                    {actionStatus}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="followup-no-document">
                              <p>Document not yet submitted</p>
                              {doc.follow_up_date && (
                                <p className="followup-date">
                                  Follow-up date: {new Date(doc.follow_up_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>No documents available.</p>
                )}
              </div>
            </div>
            <div className="followup-modal-footer">
              <button className="followup-btn-close" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Documents Confirm Accept Modal */}
      {modalType === "followupConfirmAccept" && selectedFollowup && (
        <div className="followup-confirm-accept-modal-overlay" onClick={closeModal}>
          <div className="followup-confirm-accept-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="followup-confirm-accept-modal-header">
              <h3>Confirm Document Acceptance</h3>
            </div>
            <div className="followup-confirm-accept-modal-content">
              <p className="followup-confirmation-message">Are you sure you want to accept this document?</p>
            </div>
            <div className="followup-confirm-accept-modal-footer">
              <button className="followup-btn-accept" onClick={() => handleFollowupAction("Accept")}>
                <i className="fas fa-check"></i> Yes, Accept
              </button>
              <button className="followup-btn-close" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Documents Decline Modal */}
      {modalType === "followupDecline" && selectedFollowup && (
        <div className="followup-decline-modal-overlay" onClick={closeModal}>
          <div className="followup-decline-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="followup-decline-modal-header">
              <h3>Decline Document</h3>
            </div>
            <div className="followup-decline-modal-content">
              <div className="followup-remarks-section">
                <label>Please provide remarks for declining:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks here"
                  rows="4"
                  className="followup-textarea"
                />
              </div>
            </div>
            <div className="followup-decline-modal-footer">
              <button className="followup-btn-decline" onClick={() => {
  console.log('Confirm Decline clicked');
  handleFollowupAction("Decline");
}}>
                <i className="fas fa-times"></i> Confirm Decline
              </button>
              <button className="followup-btn-close" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
       {showBeneficiaryModal && selectedApplication && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Subsidy Status</h3>
          <p>Is this solo parent qualified to receive subsidy??</p>
          <p>Solo Parent: {selectedApplication.first_name} {selectedApplication.last_name}</p>
          <p>Monthly Income: {selectedApplication.income}</p>
          <div className="modal-buttons">
            <button 
              className="btn-accept-btnsadmin"
              onClick={() => handleBeneficiaryStatus('Beneficiary')}
            >
              <i className="fas fa-check"></i> Yes, Qualified as Subsidy
            </button>
            <button 
              className="btn decline-btnsadmin"
              onClick={() => handleBeneficiaryStatus('Non-Beneficiary')}
            >
              <i className="fas fa-times"></i> No, Not Qualified
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Applications;
