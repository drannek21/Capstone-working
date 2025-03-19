import React, { useState } from 'react';
import './Applications.css';

const Renewal = () => {
  const [renewals, setRenewals] = useState([
    {
      id: 1,
      code_id: "REN-2024-001",
      first_name: "John",
      middle_name: "Smith",
      last_name: "Doe",
      barangay: "Barangay 1",
      email: "john.doe@email.com",
      age: 35,
      status: "Pending",
      remarks: ""
    },
    {
      id: 2,
      code_id: "REN-2024-002",
      first_name: "Jane",
      middle_name: "Marie",
      last_name: "Smith",
      barangay: "Barangay 2",
      email: "jane.smith@email.com",
      age: 28,
      status: "Pending",
      remarks: ""
    },
    {
      id: 3,
      code_id: "REN-2024-003",
      first_name: "Mike",
      middle_name: "James",
      last_name: "Johnson",
      barangay: "Barangay 3",
      email: "mike.johnson@email.com",
      age: 42,
      status: "Pending",
      remarks: ""
    }
  ]);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [renewalsPerPage] = useState(10);

  const openModal = (renewal) => {
    setSelectedRenewal(renewal);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedRenewal(null);
    setRemarks("");
    setShowModal(false);
    setShowRemarksModal(false);
  };

  const handleDecline = () => {
    setShowRemarksModal(true);
  };

  const handleAction = (action) => {
    if (!selectedRenewal) return;
    
    const updatedRenewals = renewals.map(renewal => 
      renewal.id === selectedRenewal.id 
        ? { 
            ...renewal, 
            status: action === "Accept" ? "Approved" : "Declined",
            remarks: action === "Accept" ? "Application approved" : remarks
          }
        : renewal
    );
    
    setRenewals(updatedRenewals);
    closeModal();
  };

  const filteredRenewals = renewals.filter(renewal => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (renewal.id && renewal.id.toString().includes(searchLower)) ||
      (renewal.code_id && renewal.code_id.toLowerCase().includes(searchLower)) ||
      (renewal.first_name && renewal.first_name.toLowerCase().includes(searchLower)) ||
      (renewal.email && renewal.email.toLowerCase().includes(searchLower)) ||
      (renewal.age && renewal.age.toString().includes(searchLower))
    );
  });

  const indexOfLastRenewal = currentPage * renewalsPerPage;
  const indexOfFirstRenewal = indexOfLastRenewal - renewalsPerPage;
  const currentRenewals = filteredRenewals.slice(indexOfFirstRenewal, indexOfLastRenewal);
  const totalPages = Math.ceil(filteredRenewals.length / renewalsPerPage);

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h2>Renewal Records</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search renewals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Code ID</th>
              <th>Name</th>
              <th>Barangay</th>
              <th>Email</th>
              <th>Age</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRenewals.map((renewal, index) => (
              <tr key={index}>
                <td>{indexOfFirstRenewal + index + 1}</td>
                <td>{renewal.code_id}</td>
                <td>{`${renewal.first_name} ${renewal.middle_name || ''} ${renewal.last_name}`}</td>
                <td>{renewal.barangay || 'N/A'}</td>
                <td>{renewal.email}</td>
                <td>{renewal.age}</td>
                <td>
                  <span className={`status-badge ${renewal.status.toLowerCase()}`}>
                    {renewal.status}
                  </span>
                </td>
                <td>{renewal.remarks || 'No remarks'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn view-btn" 
                      onClick={() => openModal(renewal)}
                      disabled={renewal.status !== "Pending"}
                    >
                      <i className="fas fa-eye"></i> Review
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

      {/* Review Modal */}
      {showModal && selectedRenewal && !showRemarksModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Application</h3>
            </div>
            <div className="modal-content">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Name</span>
                  <span className="value">
                    {`${selectedRenewal.first_name} ${selectedRenewal.middle_name || ''} ${selectedRenewal.last_name}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Code ID</span>
                  <span className="value">{selectedRenewal.code_id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email</span>
                  <span className="value">{selectedRenewal.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Age</span>
                  <span className="value">{selectedRenewal.age}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Barangay</span>
                  <span className="value">{selectedRenewal.barangay}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn accept-btn" onClick={() => handleAction("Accept")}>
                <i className="fas fa-check"></i> Accept
              </button>
              <button className="btn decline-btn" onClick={handleDecline}>
                <i className="fas fa-times"></i> Decline
              </button>
              <button className="btn view-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Remarks Modal */}
      {showRemarksModal && selectedRenewal && (
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
              <button 
                className="btn decline-btn" 
                onClick={() => handleAction("Decline")}
                disabled={!remarks.trim()}
              >
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

export default Renewal;
