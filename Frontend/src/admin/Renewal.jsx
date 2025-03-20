import React, { useState, useEffect } from 'react';
import './Renewal.css';

const Renewal = () => {
  const [renewals, setRenewals] = useState([]);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [renewalsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRenewalUsers();
  }, []);

  const fetchRenewalUsers = async () => {
    try {
      setIsLoading(true);
      const adminId = localStorage.getItem("id");
      
      if (!adminId) {
        setError("Admin ID not found. Please log in again.");
        return;
      }

      const response = await fetch(`http://localhost:8081/renewalUsers/${adminId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch renewal users");
      }

      const data = await response.json();
      setRenewals(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching renewal users:", error);
      setError("Failed to fetch renewal users");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAction = async (action, renewal) => {
    try {
      // Update user status
      const statusResponse = await fetch('http://localhost:8081/updateUserStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: renewal.userId,
          status: action === "Accept" ? "Verified" : "Declined",
          remarks: action === "Accept" ? "You have renewed" : remarks
        }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      const updatedRenewals = renewals.map(r => 
        r.userId === renewal.userId 
          ? { 
              ...r, 
              status: action === "Accept" ? "Verified" : "Declined",
              remarks: action === "Accept" ? "You have renewed" : remarks
            }
          : r
      );
      
      setRenewals(updatedRenewals);
      closeModal();
      // Refresh the list
      fetchRenewalUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  const filteredRenewals = renewals.filter(renewal => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (renewal.userId && renewal.userId.toString().includes(searchLower)) ||
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

  if (isLoading) {
    return (
      <div className="renewal-container">
        <div className="loading">Loading renewal applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="renewal-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="renewal-container">
      <div className="renewal-header">
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRenewals.map((renewal, index) => (
              <tr key={index}>
                <td>{indexOfFirstRenewal + index + 1}</td>
                <td>{renewal.code_id}</td>
                <td>{`${renewal.first_name} ${renewal.middle_name || ''} ${renewal.last_name}`}</td>
                <td>
                  <span className={`status-badge ${renewal.status.toLowerCase()}`}>
                    {renewal.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn view-btn" 
                      onClick={() => openModal(renewal)}
                      disabled={renewal.status !== "Renewal"}
                    >
                      <i className="fas fa-eye"></i> Review
                    </button>
                    <button 
                      className="btn accept-btn" 
                      onClick={() => handleAction("Accept", renewal)}
                    >
                      <i className="fas fa-check"></i> Accept
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
              <h3>Review Renewal Application</h3>
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
                {selectedRenewal.children && selectedRenewal.children.length > 0 && (
                  <div className="detail-item">
                    <span className="label">Children</span>
                    <span className="value">
                      {selectedRenewal.children.map((child, idx) => (
                        <div key={idx}>
                          {child.first_name} {child.middle_name || ''} {child.last_name}
                          {child.age && ` (${child.age} years old)`}
                        </div>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn accept-btn" onClick={() => handleAction("Accept", selectedRenewal)}>
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
              <h3>Decline Renewal Application</h3>
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
                onClick={() => handleAction("Decline", selectedRenewal)}
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
