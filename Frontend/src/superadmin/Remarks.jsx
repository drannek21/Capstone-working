import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Remarks.css';

const Remarks = () => {
  const [remarks, setRemarks] = useState([]);
  const [terminatedUsers, setTerminatedUsers] = useState([]); // Add new state
  const [activeTab, setActiveTab] = useState('remarks'); // Add tab state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [remarksPerPage] = useState(10);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState(null);

  useEffect(() => {
    fetchRemarks();
    fetchTerminatedUsers(); // Add new fetch function
  }, []);

  const handleUnterminate = async (userId) => {
    try {
      await axios.post('http://localhost:8081/unTerminateUser', { userId });
      fetchTerminatedUsers(); // Refresh the terminated users list
    } catch (err) {
      console.error('Error unterminating user:', err);
      alert('Failed to unterminate user');
    }
  };

  const fetchTerminatedUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8081/getTerminatedUsers');
      setTerminatedUsers(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError('Error fetching terminated users');
    }
  };

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8081/getAllRemarks');
      setRemarks(response.data);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Error fetching remarks');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await axios.post('http://localhost:8081/acceptRemarks', { userId });
      setShowRemarksModal(false);
      fetchRemarks(); // Refresh the list
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleDecline = async (userId) => {
    try {
      await axios.post('http://localhost:8081/declineRemarks', { userId });
      setShowRemarksModal(false);
      fetchRemarks(); // Refresh the list
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const openRemarksModal = (remark) => {
    setSelectedRemark(remark);
    setShowRemarksModal(true);
  };

  const filteredRemarks = remarks.filter(remark => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (remark.code_id && remark.code_id.toLowerCase().includes(searchLower)) ||
      (remark.user_name && remark.user_name.toLowerCase().includes(searchLower)) ||
      (remark.remarks && remark.remarks.toLowerCase().includes(searchLower))
    );
  });

  const indexOfLastRemark = currentPage * remarksPerPage;
  const indexOfFirstRemark = indexOfLastRemark - remarksPerPage;
  const currentRemarks = filteredRemarks.slice(indexOfFirstRemark, indexOfLastRemark);
  const totalPages = Math.ceil(filteredRemarks.length / remarksPerPage);

  if (loading) {
    return <div className="loading">Loading remarks...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="remarks-container">
      <div className="remarks-header">
        <h2>Remarks Management</h2>
      </div>
      <div className="controls-section">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'remarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('remarks')}
          >
            Pending Remarks
          </button>
          <button 
            className={`tab-btn ${activeTab === 'terminated' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminated')}
          >
            Terminated Users
          </button>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {activeTab === 'remarks' ? (
        // Existing Remarks Table
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code ID</th>
                <th>User Name</th>
                <th>Barangay</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRemarks.map((remark, index) => (
                <tr key={index}>
                  <td>{indexOfFirstRemark + index + 1}</td>
                  <td>{remark.code_id}</td>
                  <td>{remark.user_name}</td>
                  <td>{remark.admin_barangay}</td>
                  <td>{new Date(remark.remarks_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => openRemarksModal(remark)}
                    >
                      View Remarks
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // New Terminated Users Table
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code ID</th>
                <th>User Name</th>
                <th>Barangay</th>
                <th>Termination Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {terminatedUsers.map((user, index) => (
                <tr key={index}>
                  <td>{indexOfFirstRemark + index + 1}</td>
                  <td>{user.code_id}</td>
                  <td>{user.user_name}</td>
                  <td>{user.admin_barangay}</td>
                  <td>{new Date(user.terminated_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="unterminate-btn"
                      onClick={() => handleUnterminate(user.user_id)}
                    >
                      Re-verified
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Remarks Modal */}
      {showRemarksModal && selectedRemark && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>User Remarks</h3>
            <div className="remarks-content">
              <p><strong>User:</strong> {selectedRemark.user_name}</p>
              <p><strong>Code ID:</strong> {selectedRemark.code_id}</p>
              <p><strong>Barangay:</strong> {selectedRemark.admin_barangay}</p>
              <p><strong>Date:</strong> {new Date(selectedRemark.remarks_at).toLocaleDateString()}</p>
              <div className="remarks-text">
                <strong>Remarks:</strong>
                <p>{selectedRemark.remarks}</p>
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowRemarksModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button 
                onClick={() => handleDecline(selectedRemark.user_id)} 
                className="decline-btn"
              >
                Set as Verified
              </button>
              <button 
                onClick={() => handleAccept(selectedRemark.user_id)} 
                className="accept-btn"
              >
                Set as Terminated
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Remarks;
