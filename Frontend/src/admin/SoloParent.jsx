import React, { useState, useEffect } from 'react';
import './SoloParent.css';
import axios from 'axios';
import { useContext } from 'react';
import { AdminContext } from '../contexts/AdminContext';

const SoloParent = () => {
  const [soloParents, setSoloParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [parentsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { adminId } = useContext(AdminContext);

  useEffect(() => {
    fetchVerifiedUsers();
  }, [adminId, selectedStatus]);

  const fetchVerifiedUsers = async () => {
    try {
      setIsLoading(true);
      let url = `http://localhost:8081/verifiedUsers/${adminId}`;
      if (selectedStatus !== 'all') {
        url += `?status=${selectedStatus}`;
      }
      const response = await axios.get(url);
      setSoloParents(response.data);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Error fetching verified users');
    } finally {
      setIsLoading(false);
    }
  };

  const openRevokeModal = (parent) => {
    setSelectedParent(parent);
    setShowRevokeModal(true);
  };

  const closeModal = () => {
    setSelectedParent(null);
    setRemarks("");
    setShowRevokeModal(false);
  };

  const handleRevoke = async () => {
    if (!selectedParent || !remarks.trim()) return;
    
    try {
      const response = await fetch('http://localhost:8081/saveRemarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code_id: selectedParent.code_id,
          remarks: remarks,
          user_id: selectedParent.userId,
          admin_id: adminId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save remarks');
      }

      // Refresh the list to show new remarks
      await fetchVerifiedUsers();
      closeModal();
    } catch (err) {
      console.error('Error saving remarks:', err);
      alert('Failed to save remarks. Please try again.');
    }
  };

  const filteredParents = soloParents.filter(parent => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (parent.userId && parent.userId.toString().includes(searchLower)) ||
      (parent.code_id && parent.code_id.toLowerCase().includes(searchLower)) ||
      (parent.first_name && parent.first_name.toLowerCase().includes(searchLower)) ||
      (parent.email && parent.email.toLowerCase().includes(searchLower)) ||
      (parent.age && parent.age.toString().includes(searchLower))
    );
  });

  const indexOfLastParent = currentPage * parentsPerPage;
  const indexOfFirstParent = indexOfLastParent - parentsPerPage;
  const currentParents = filteredParents.slice(indexOfFirstParent, indexOfLastParent);
  const totalPages = Math.ceil(filteredParents.length / parentsPerPage);

  if (isLoading) {
    return (
      <div className="soloparent-container">
        <div className="loading">Loading verified solo parents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="soloparent-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  const classifications = {
    '001': 'Birth due to rape',
    '002': 'Death of spouse',
    '003': 'Detention of spouse',
    '004': "Spouse's incapacity",
    '005': 'Legal separation',
    '006': 'Annulled marriage',
    '007': 'Abandoned by spouse',
    '008': "OFW's family member",
    '009': 'Unmarried parent',
    '010': 'Legal guardian',
    '011': 'Relative caring for child',
    '012': 'Pregnant woman solo caregiver'
  };

  return (
    <div className="soloparent-container">
      <div className="soloparent-header">
        <h2>Solo Parent Management</h2>
        <div className="search-container">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending Remarks">Pending Remarks</option>
            <option value="Terminated">Terminated</option>
          </select>
          <input
            type="text"
            placeholder="Search solo parents..."
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
              <th>Email</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentParents.map((parent, index) => (
              <tr 
                key={index} 
                className={parent.status === "Terminated" ? "terminated-row" : ""}
              >
                <td>{indexOfFirstParent + index + 1}</td>
                <td>{parent.code_id}</td>
                <td>{`${parent.first_name} ${parent.middle_name ? parent.middle_name[0] + '.' : ''} ${parent.last_name}`}</td>
                <td>{parent.email}</td>
                <td>{classifications[parent.classification] || parent.classification}</td>
                <td>
                  <span className={`status-badge ${parent.status.toLowerCase()}`}>
                    {parent.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn decline-btn" 
                    onClick={() => openRevokeModal(parent)}
                    disabled={parent.status === "Unverified" || 
                             parent.status === "Pending Remarks" ||
                             parent.status === "Terminated"}
                    title={
                      parent.status === "Terminated" ? "User is already terminated" :
                      parent.status === "Pending Remarks" ? "User is under investigation" :
                      parent.status === "Unverified" ? "User is not verified" : ""
                    }
                  >
                    <i className="fas fa-ban"></i> Revoke
                  </button>
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

      {/* Revoke Verification Modal */}
      {showRevokeModal && selectedParent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Remarks</h3>
            </div>
            <div className="modal-content compact">
              <div className="details-grid compact">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">
                    {`${selectedParent.first_name} ${selectedParent.middle_name || ''} ${selectedParent.last_name}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Code ID:</span>
                  <span className="value">{selectedParent.code_id}</span>
                </div>
              </div>
              <div className="remarks-section compact">
                <label>Add remarks:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks here"
                  rows="3"
                  className="compact-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn view-btn" 
                onClick={handleRevoke}
                disabled={!remarks.trim()}
              >
                Save Remarks
              </button>
              <button className="btn decline-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoloParent;
