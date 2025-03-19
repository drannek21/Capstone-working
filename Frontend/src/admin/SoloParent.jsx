import React, { useState } from 'react';
import './Applications.css';

const SoloParent = () => {
  const [soloParents, setSoloParents] = useState([
    {
      id: 1,
      code_id: "SP-2024-001",
      first_name: "Maria",
      middle_name: "Santos",
      last_name: "Cruz",
      barangay: "Barangay 1",
      email: "maria.cruz@email.com",
      age: 32,
      children: 2,
      classification: "007",
      status: "Verified",
      remarks: ""
    },
    {
      id: 2,
      code_id: "SP-2024-002",
      first_name: "Pedro",
      middle_name: "Garcia",
      last_name: "Santos",
      barangay: "Barangay 2",
      email: "pedro.santos@email.com",
      age: 45,
      children: 1,
      classification: "002",
      status: "Verified",
      remarks: ""
    },
    {
      id: 3,
      code_id: "SP-2024-003",
      first_name: "Ana",
      middle_name: "Rivera",
      last_name: "Reyes",
      barangay: "Barangay 3",
      email: "ana.reyes@email.com",
      age: 29,
      children: 3,
      classification: "009",
      status: "Verified",
      remarks: ""
    }
  ]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [parentsPerPage] = useState(10);

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

  const openRevokeModal = (parent) => {
    setSelectedParent(parent);
    setShowRevokeModal(true);
  };

  const closeModal = () => {
    setSelectedParent(null);
    setRemarks("");
    setShowRevokeModal(false);
  };

  const handleRevoke = () => {
    if (!selectedParent || !remarks.trim()) return;
    
    const updatedParents = soloParents.map(parent => 
      parent.id === selectedParent.id 
        ? { 
            ...parent, 
            status: "Unverified",
            remarks: remarks
          }
        : parent
    );
    
    setSoloParents(updatedParents);
    closeModal();
  };

  const filteredParents = soloParents.filter(parent => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (parent.id && parent.id.toString().includes(searchLower)) ||
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

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h2>Verified Solo Parents</h2>
        <div className="search-container">
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
              <th>Barangay</th>
              <th>Email</th>
              <th>Children</th>
              <th>Classification</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentParents.map((parent, index) => (
              <tr key={index}>
                <td>{indexOfFirstParent + index + 1}</td>
                <td>{parent.code_id}</td>
                <td>{`${parent.first_name} ${parent.middle_name ? parent.middle_name[0] + '.' : ''} ${parent.last_name}`}</td>
                <td>{parent.barangay || 'N/A'}</td>
                <td>{parent.email}</td>
                <td className="text-center">{parent.children}</td>
                <td>{classifications[parent.classification]}</td>
                <td>
                  <span className={`status-badge ${parent.status.toLowerCase()}`}>
                    {parent.status}
                  </span>
                </td>
                <td>{parent.remarks || 'No remarks'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn decline-btn" 
                      onClick={() => openRevokeModal(parent)}
                      disabled={parent.status === "Unverified"}
                    >
                      <i className="fas fa-ban"></i> Revoke
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

      {/* Revoke Verification Modal */}
      {showRevokeModal && selectedParent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Revoke Verification</h3>
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
                <label>Reason for revoking verification:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter reason here"
                  rows="3"
                  className="compact-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn decline-btn" 
                onClick={handleRevoke}
                disabled={!remarks.trim()}
              >
                <i className="fas fa-ban"></i> Confirm Revoke
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

export default SoloParent;
