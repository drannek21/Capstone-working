import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:8081/pendingUsers');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const openModal = (application, type) => {
    setSelectedApplication(application);
    setStepPage(1); // Reset step pagination
    setRemarks("");
    setModalType(type);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setRemarks("");
    setModalType("");
    document.body.style.overflow = 'auto';
  };

  const handleAction = async (action) => {
    if (!selectedApplication) return;
    if (action === "Decline" && !remarks) {
      alert("Please provide remarks for declining.");
      return;
    }
  
    try {
      await axios.post('http://localhost:8081/updateUserStatus', {
        userId: selectedApplication.userId,
        status: action === "Accept" ? "Verified" : "Declined",
        remarks: remarks,
      });
  
      await fetchApplications(); // Refresh the list from backend
      closeModal();
    } catch (error) {
      console.error('Error updating status:', error);
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

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h2>Applications Details</h2>
        <input
          type="text"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>code_id</th>
              <th>Name</th>
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
                <td>{app.first_name} {app.middle_name} {app.last_name}</td>
                <td>{app.email}</td>
                <td>{app.age}</td>
                <td>
                  <button className="btn view-btn" onClick={() => openModal(app, "view")}>View</button>
                  <button className="btn accept-btn" onClick={() => openModal(app, "confirmAccept")}>Accept</button>
                  <button className="btn decline-btn" onClick={() => openModal(app, "decline")}>Decline</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button 
          className="btn" 
          onClick={() => setCurrentPage(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          className="btn" 
          onClick={() => setCurrentPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* PAGINATED VIEW DETAILS MODAL */}
      {modalType === "view" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details (Step {stepPage}/5)</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              {stepPage === 1 && (
                <>
                  <h4>Personal Information</h4>
                  <p><strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name}</p>
                  <p><strong>Age:</strong> {selectedApplication.age}</p>
                  <p><strong>Gender:</strong> {selectedApplication.gender}</p>
                  <p><strong>Date of Birth:</strong> {selectedApplication.date_of_birth}</p>
                  <p><strong>Place of Birth:</strong> {selectedApplication.place_of_birth}</p>
                  <p><strong>Address:</strong> {selectedApplication.address}</p>
                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                  <p><strong>Contact Number:</strong> {selectedApplication.contact_number}</p>
                  <p><strong>Education:</strong> {selectedApplication.education}</p>
                  <p><strong>Occupation:</strong> {selectedApplication.occupation}</p>
                  <p><strong>Company:</strong> {selectedApplication.company}</p>
                  <p><strong>Income:</strong> {selectedApplication.income}</p>
                  <p><strong>Employment Status:</strong> {selectedApplication.employment_status}</p>
                  <p><strong>Civil Status:</strong> {selectedApplication.civil_status}</p>
                  <p><strong>Religion:</strong> {selectedApplication.religion}</p>
                  <p><strong>Pantawid Beneficiary:</strong> {selectedApplication.pantawid_beneficiary}</p>
                  <p><strong>Indigenous:</strong> {selectedApplication.indigenous}</p>
                  <p><strong>Code ID:</strong> {selectedApplication.code_id}</p>
               </>
              )}

              {stepPage === 2 && (
                <>
                  <h4>Family Information (Children)</h4>
                  <p><strong>Child Name:</strong> {selectedApplication.child_first_name} {selectedApplication.child_middle_name} {selectedApplication.child_last_name}</p>
                  <p><strong>Birthdate:</strong> {selectedApplication.child_birthdate}</p>
                  <p><strong>Age:</strong> {selectedApplication.child_age}</p>
                  <p><strong>Education:</strong> {selectedApplication.child_education}</p>
                </>
              )}

              {stepPage === 3 && (
                <>
                  <h4>Classification</h4>
                  <p><strong>Type:</strong> {selectedApplication.classification}</p>
                </>
              )}

              {stepPage === 4 && (
                <>
                  <h4>Needs/Problems</h4>
                  <p><strong>Details:</strong> {selectedApplication.needs_problems}</p>
                </>
              )}

              {stepPage === 5 && (
                <>
                  <h4>Emergency Contact</h4>
                  <p><strong>Name:</strong> {selectedApplication.emergency_name}</p>
                  <p><strong>Relationship:</strong> {selectedApplication.emergency_relationship}</p>
                  <p><strong>Address:</strong> {selectedApplication.emergency_address}</p>
                  <p><strong>Contact Number:</strong> {selectedApplication.emergency_contact}</p>
                </>
              )}
            </div>

            {/* STEP PAGINATION BUTTONS */}
            <div className="modal-footer">
              {stepPage > 1 && <button className="btn prev-btn" onClick={() => setStepPage(stepPage - 1)}>Previous</button>}
              {stepPage < 5 && <button className="btn next-btn" onClick={() => setStepPage(stepPage + 1)}>Next</button>}
              {stepPage === 5 && <button className="btn accept-btn" onClick={() => handleAction("Accept")}>Accept</button>}
              {stepPage === 5 && <button className="btn decline-btn" onClick={() => handleAction("Decline")}>Decline</button>}
              <button className="btn close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modalType === "confirmAccept" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Acceptance</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to accept this application?</p>
            </div>
            <div className="modal-footer">
              <button className="btn accept-btn" onClick={() => handleAction("Accept")}>Yes, Accept</button>
              <button className="btn close-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {modalType === "decline" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Decline Application</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <h4>Please provide remarks for declining:</h4>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks here"
                rows="4"
                className="remarks-input"
              />
            </div>

            <div className="modal-footer">
              <button className="btn decline-btn" onClick={handleAction}>Confirm Decline</button>
              <button className="btn close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
