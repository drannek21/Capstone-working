import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminSideBar from './SuperAdminSideBar';
import './Renewal.css';

const Renewal = () => {
  const [renewals, setRenewals] = useState([]);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('All');

  const barangays = [
    'All',
    'Adia',
    'Bagong Pook',
    'Bagumbayan',
    'Bubucal',
    'Cabooan',
    'Calangay',
    'Cambuja',
    'Coralan',
    'Cueva',
    'Inayapan',
    'Jose P. Laurel, Sr.',
    'Jose P. Rizal',
    'Juan Santiago',
    'Kayhacat',
    'Macasipac',
    'Masinao',
    'Matalinting',
    'Pao-o',
    'Parang ng Buho',
    'Poblacion Dos',
    'Poblacion Quatro',
    'Poblacion Tres',
    'Poblacion Uno',
    'Talangka',
    'Tungkod'
  ];

  useEffect(() => {
    fetchRenewalUsers();
  }, []);

  const fetchRenewalUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8081/allRenewalUsers`);
      
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
    setShowModal(false);
  };

  const handleAction = async (action, renewal) => {
    try {
      const statusResponse = await fetch('http://localhost:8081/superadminUpdateStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: renewal.userId,
          status: action === "Accept" ? "Verified" : "Declined",
          remarks: action === "Accept" ? "Your renewal has been approved by a superadmin" : "Your renewal has been declined"
        }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update user status');
      }

      closeModal();
      fetchRenewalUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  const filteredRenewals = renewals.filter(renewal => {
    const matchesSearch = searchTerm === '' || 
      renewal.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      renewal.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      renewal.middle_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBarangay = selectedBarangay === 'All' || 
      renewal.barangay === selectedBarangay;
    
    return matchesSearch && matchesBarangay;
  });

  if (isLoading) {
    return (
      <div className="super-admin-dashboard">
        <SuperAdminSideBar />
        <div className="super-admin-container">
          <div className="super-admin-content">
            <div className="renewal-container">
              <div className="loading">Loading renewal applications...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="super-admin-dashboard">
        <SuperAdminSideBar />
        <div className="super-admin-container">
          <div className="super-admin-content">
            <div className="renewal-container">
              <div className="error">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      <SuperAdminSideBar />
      <div className="super-admin-container">
        <div className="super-admin-content">
          <div className="renewal-container">
            <div className="header-section">
              <h1 className="section-title">Renewal Applications</h1>
              <div className="filter-controls">
                <div className="filter-item">
                  <label htmlFor="barangayFilter">Barangay:</label>
                  <select 
                    id="barangayFilter"
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    className="filter-select"
                  >
                    {barangays.map((barangay, index) => (
                      <option key={index} value={barangay}>{barangay}</option>
                    ))}
                  </select>
                </div>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Barangay</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRenewals.map((renewal, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{`${renewal.first_name} ${renewal.middle_name || ''} ${renewal.last_name}`}</td>
                      <td>{renewal.barangay}</td>
                      <td>
                          <button 
                            className="btn view-btn" 
                            onClick={() => openModal(renewal)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                          <button 
                            className="btn accept-btn" 
                            onClick={() => handleAction("Accept", renewal)}
                          >
                            <i className="fas fa-check"></i> Accept
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Certificate View Modal */}
            {showModal && selectedRenewal && (
              <div className="modal-overlay" onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>View Barangay Certificate</h3>
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
                        <span className="label">Barangay</span>
                        <span className="value">{selectedRenewal.barangay}</span>
                      </div>
                    </div>

                    {/* Certificate Section */}
                    <div className="documents-section">
                      <h4>Barangay Certificate</h4>
                      {selectedRenewal.documents && selectedRenewal.documents.length > 0 ? (
                        <div className="documents-list">
                          {selectedRenewal.documents.map((doc, index) => (
                            <div key={index} className="document-item">
                              <div className="document-preview">
                                <img 
                                  src={doc.file_url} 
                                  alt="Barangay Certificate"
                                  className="document-thumbnail"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Certificate+Not+Found";
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
                          ))}
                        </div>
                      ) : (
                        <div className="no-documents">
                          <p>No barangay certificate submitted yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn accept-btn" onClick={() => handleAction("Accept", selectedRenewal)}>
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button className="btn decline-btn" onClick={() => handleAction("Decline", selectedRenewal)}>
                      <i className="fas fa-times"></i> Decline
                    </button>
                    <button className="btn view-btn" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Renewal; 