import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminSideBar from './SuperAdminSideBar';
import './UserManagement.css';
import { FaEye, FaEyeSlash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [barangays, setBarangays] = useState([
    'All',
    'Adia', 'Bagong Pook', 'Bagumbayan', 'Bubucal', 'Cabooan',
    'Calangay', 'Cambuja', 'Coralan', 'Cueva', 'Inayapan',
    'Jose P. Laurel, Sr.', 'Jose P. Rizal', 'Juan Santiago',
    'Kayhacat', 'Macasipac', 'Masinao', 'Matalinting',
    'Pao-o', 'Parang ng Buho', 'Poblacion Dos',
    'Poblacion Quatro', 'Poblacion Tres', 'Poblacion Uno',
    'Talangka', 'Tungkod'
  ]);
  const [assignedBarangays, setAssignedBarangays] = useState(new Set());
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    barangay: ''
  });
  const [editUser, setEditUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const assigned = new Set(users.map(user => user.barangay));
    setAssignedBarangays(assigned);
  }, [users]);

  const availableBarangays = barangays.filter(
    barangay => barangay === 'All' || !assignedBarangays.has(barangay)
  );

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/admins');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError('Failed to fetch admins');
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
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.barangay?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = selectedBarangay === 'All' || user.barangay === selectedBarangay;
    return matchesSearch && matchesBarangay;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    
    if (sortConfig.key === 'barangay') {
      if (sortConfig.direction === 'asc') {
        return a.barangay.localeCompare(b.barangay);
      }
      return b.barangay.localeCompare(a.barangay);
    }
    
    if (sortConfig.key === 'email') {
      if (sortConfig.direction === 'asc') {
        return a.email.localeCompare(b.email);
      }
      return b.email.localeCompare(a.email);
    }
    
    return 0;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barangay') {
      const formattedBarangay = value.replace(/\s+/g, '');
      const capitalizedBarangay = formattedBarangay.charAt(0).toUpperCase() + formattedBarangay.slice(1).toLowerCase();
      setNewUser(prev => ({
        ...prev,
        barangay: value,
        email: `barangay${formattedBarangay.toLowerCase()}@gmail.com`,
        password: `${capitalizedBarangay}123@`
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8081/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowAddModal(false);
        setNewUser({ email: '', password: '', barangay: '' });
        fetchUsers();
      } else {
        setError(data.message || 'Failed to add admin');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error:', err);
    }
  };

  const handleEditClick = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      password: '',
      barangay: user.barangay
    });
    setError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`http://localhost:8081/admins/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editUser)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setEditUser(null);
        fetchUsers();
      } else {
        setError(data.message || 'Failed to update admin');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error:', err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barangay') {
      const formattedBarangay = value.replace(/\s+/g, '');
      const capitalizedBarangay = formattedBarangay.charAt(0).toUpperCase() + formattedBarangay.slice(1).toLowerCase();
      setEditUser(prev => ({
        ...prev,
        barangay: value,
        email: `barangay${formattedBarangay.toLowerCase()}@gmail.com`,
        password: `${capitalizedBarangay}123@`
      }));
    } else {
      setEditUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="super-admin-content">
      <SuperAdminSideBar />
      <div className="user-management-container">
        <div className="header-section">
          <h1 className="section-title">Admin Management</h1>
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
                placeholder="Search Admins..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              <button 
                className="add-user-btn"
                onClick={() => {
                  setError(null);
                  setShowAddModal(true);
                }}
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('email')}>
                      Email {getSortIcon('email')}
                    </th>
                    <th onClick={() => handleSort('barangay')}>
                      Barangay {getSortIcon('barangay')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.barangay}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditClick(user)}
                          >
                            Edit
                          </button>
                          <button 
                            className="view-details-btn"
                            onClick={() => handleViewDetails(user)}
                          >
                            View Details
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add New Admin</h2>
              </div>
              <div className="modal-content">
                <form onSubmit={handleAddUser}>
                  {error && <div className="error-message">{error}</div>}
                  <div className="form-group">
                    <label>Email:</label>
                    <input 
                      type="email" 
                      name="email"
                      value={newUser.email}
                      onChange={handleNewUserChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <div className="password-input-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        required
                        className="password-input"
                      />
                      <span
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Barangay:</label>
                    <select 
                      name="barangay"
                      value={newUser.barangay}
                      onChange={handleNewUserChange}
                      required
                    >
                      <option value="">Select Barangay</option>
                      {availableBarangays.filter(b => b !== 'All').map(barangay => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button 
                      type="submit" 
                      className="submit-btn"
                    >
                      Add Admin
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setError(null);
                        setShowAddModal(false);
                        setNewUser({ email: '', password: '', barangay: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editUser && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Edit Admin</h2>
              </div>
              <div className="modal-content">
                <form onSubmit={handleEditSubmit}>
                  {error && <div className="error-message">{error}</div>}
                  <div className="form-group">
                    <label>Email:</label>
                    <input 
                      type="email" 
                      name="email"
                      value={editUser.email}
                      onChange={handleEditChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <div className="password-input-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={editUser.password}
                        onChange={handleEditChange}
                        placeholder="Leave blank to keep current password"
                        className="password-input"
                        style={{ width: '250px', paddingRight: '30px' }}
                      />
                      <span
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Barangay:</label>
                    <select 
                      name="barangay"
                      value={editUser.barangay}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Select Barangay</option>
                      {availableBarangays.filter(b => b !== 'All').map(barangay => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button 
                      type="submit" 
                      className="submit-btn"
                    >
                      Update
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setError(null);
                        setShowEditModal(false);
                        setEditUser(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Admin Details</h2>
              </div>
              <div className="modal-content">
                <div className="detail-group">
                  <label>Email:</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="detail-group">
                  <label>Barangay:</label>
                  <p>{selectedUser.barangay}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;