import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [barangays, setBarangays] = useState(['All']);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/verified-users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        
        // Extract unique barangays for the dropdown
        const uniqueBarangays = ['All', ...new Set(data.users.map(user => user.barangay).filter(Boolean))];
        setBarangays(uniqueBarangays);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.barangay?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBarangay = selectedBarangay === 'All' || user.barangay === selectedBarangay;
    
    return matchesSearch && matchesBarangay;
  });

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleStatusChange = (userId, newStatus) => {
    // Mock implementation - in a real app, this would make an API call
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
    
    // If the user being changed is also the selected user in the modal, update that too
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>User Management</h2>
        <div className="filter-container">
          <div className="barangay-filter">
            <select 
              value={selectedBarangay}
              onChange={handleBarangayChange}
              className="barangay-select"
            >
              {barangays.map(barangay => (
                <option key={barangay} value={barangay}>
                  {barangay === 'All' ? 'All Barangays' : barangay}
                </option>
              ))}
            </select>
          </div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Barangay</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.barangay}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td className="action-buttons">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(user)}
                    >
                      View
                    </button>
                    {user.status === "Verified" && (
                      <button
                        className="unverify-btn"
                        onClick={() => handleStatusChange(user.id, "Pending")}
                      >
                        Unverify
                      </button>
                    )}
                    {user.status === "Pending" && (
                      <button
                        className="verify-btn"
                        onClick={() => handleStatusChange(user.id, "Verified")}
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Details</h3>
              <button 
                className="close-modal"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Name:</label>
                <p>{selectedUser.name}</p>
              </div>
              <div className="detail-group">
                <label>Email:</label>
                <p>{selectedUser.email}</p>
              </div>
              <div className="detail-group">
                <label>Barangay:</label>
                <p>{selectedUser.barangay}</p>
              </div>
              <div className="detail-group">
                <label>Address:</label>
                <p>{selectedUser.address}</p>
              </div>
              <div className="detail-group">
                <label>Contact Number:</label>
                <p>{selectedUser.contact_number}</p>
              </div>
              <div className="detail-group">
                <label>Registration Date:</label>
                <p>{formatDate(selectedUser.created_at)}</p>
              </div>
              <div className="detail-group">
                <label>Status:</label>
                <div className="status-with-actions">
                  <span className={`status-badge ${selectedUser.status.toLowerCase()}`}>
                    {selectedUser.status}
                  </span>
                  <div className="modal-actions">
                    {selectedUser.status === "Verified" && (
                      <button
                        className="unverify-btn"
                        onClick={() => handleStatusChange(selectedUser.id, "Pending")}
                      >
                        Unverify User
                      </button>
                    )}
                    {selectedUser.status === "Pending" && (
                      <button
                        className="verify-btn"
                        onClick={() => handleStatusChange(selectedUser.id, "Verified")}
                      >
                        Verify User
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;