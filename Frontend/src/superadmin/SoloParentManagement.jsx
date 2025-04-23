import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SoloParentManagement.css';
import html2canvas from 'html2canvas';
import dswdLogo from '../assets/dswd-logo.png';
import avatar from '../assets/avatar.jpg';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const SoloParentManagement = () => {
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [stepPage, setStepPage] = useState(1);
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const tableContainerRef = useRef(null);
  const [showIDModal, setShowIDModal] = useState(false);
  const [selectedIDUser, setSelectedIDUser] = useState(null);

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

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending_remarks', label: 'Pending Remarks' },
    { value: 'terminated', label: 'Terminated Users' },
    { value: 'renewal', label: 'Renewal' },
    { value: 'beneficiaries', label: 'Verified Beneficiaries' }
  ];

  useEffect(() => {
    fetchVerifiedUsers();
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, []);

  const checkTableScroll = () => {
    if (tableContainerRef.current) {
      const { scrollWidth, clientWidth } = tableContainerRef.current;
      setIsTableScrollable(scrollWidth > clientWidth);
    }
  };

  const fetchVerifiedUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8081/verifiedUsersSA');
      setVerifiedUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching verified users:', error);
      setVerifiedUsers([]);
      alert('Error fetching verified users. Please refresh the page.');
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setStepPage(1);
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    document.body.style.overflow = 'auto';
  };

  const handleAccept = async (code_id) => {
    try {
      const response = await axios.post('http://localhost:8081/acceptRemarks', { code_id });
      if (response.data.success) {
        setSuccessMessage('Account Verified');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to verify user');
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      alert('Failed to verify user');
    }
  };

  const handleDecline = async (code_id) => {
    try {
      const response = await axios.post('http://localhost:8081/declineRemarks', { code_id });
      if (response.data.success) {
        setSuccessMessage('Account Terminated');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to terminate user');
      }
    } catch (err) {
      console.error('Error terminating user:', err);
      alert('Failed to terminate user');
    }
  };

  const handleAction = async (action, user) => {
    try {
      const response = await axios.post('http://localhost:8081/superadminUpdateStatus', {
        userId: user.userId,
        status: action === "Accept" ? "Verified" : "Renewal",
        remarks: action === "Accept" ? "Your renewal has been approved by a superadmin" : "Your renewal has been declined"
      });

      if (response.data.success) {
        setSuccessMessage(action === "Accept" ? 'Renewal Accepted' : 'Renewal Declined');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    }
  };

  const handleUnterminate = async (userId) => {
    try {
      const response = await axios.post('http://localhost:8081/unTerminateUser', { userId });
      if (response.data.success) {
        setSuccessMessage('Account Re-verified');
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          closeModal();
          fetchVerifiedUsers(); // Refresh the list
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to re-verify user');
      }
    } catch (err) {
      console.error('Error re-verifying user:', err);
      alert('Failed to re-verify user');
    }
  };

  const captureID = async (element) => {
    // Create a clone of the element
    const clone = element.cloneNode(true);
    clone.classList.add('capturing');
    document.body.appendChild(clone);
    
    try {
      // Get the full scroll dimensions
      const width = clone.scrollWidth;
      const height = clone.scrollHeight;
      
      const options = {
        scale: 2,
        backgroundColor: '#fff',
        logging: true,
        useCORS: true,
        allowTaint: true,
        width: width,
        height: height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height
      };

      const canvas = await html2canvas(clone, options);
      return canvas;
    } finally {
      document.body.removeChild(clone);
    }
  };

  const downloadID = async (side) => {
    try {
      // Get the element to capture based on side
      const targetElement = document.querySelector(side === 'back' ? '.id-card.back' : '.id-card.front');
      if (!targetElement) {
        console.error('Target element not found');
        return;
      }

      // Get the actual dimensions
      const rect = targetElement.getBoundingClientRect();

      // Capture the current state
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 3,
        width: rect.width,
        height: rect.height,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(side === 'back' ? '.id-card.back' : '.id-card.front');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
            clonedElement.style.display = 'flex';
            clonedElement.style.opacity = '1';
            
            // Make sure all content is visible
            const header = clonedElement.querySelector('.id-card-header');
            const body = clonedElement.querySelector('.id-card-body');
            const terms = clonedElement.querySelector('.terms-section');
            const signature = clonedElement.querySelector('.signature-section');
            
            if (header) header.style.display = 'flex';
            if (body) body.style.display = 'flex';
            if (terms) terms.style.display = 'block';
            if (signature) signature.style.display = 'flex';
          }
        }
      });

      // Download the image
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `solo_parent_id_${side === 'back' ? 'back' : 'front'}.png`;
      link.click();

    } catch (error) {
      console.error('Error generating ID:', error);
      alert('Failed to download ID. Please try again.');
    }
  };

  const printID = async () => {
    try {
      // Get front and back elements
      const frontElement = document.querySelector('.id-card.front');
      const backElement = document.querySelector('.id-card.back');
      
      if (!frontElement || !backElement) {
        console.error('ID card elements not found');
        return;
      }

      // Get dimensions
      const frontRect = frontElement.getBoundingClientRect();
      const backRect = backElement.getBoundingClientRect();

      // Capture options
      const options = {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 3,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedFront = clonedDoc.querySelector('.id-card.front');
          const clonedBack = clonedDoc.querySelector('.id-card.back');
          
          [clonedFront, clonedBack].forEach(element => {
            if (element) {
              element.style.transform = 'none';
              element.style.position = 'relative';
              element.style.display = 'flex';
              element.style.opacity = '1';
              
              // Make sure all content is visible
              const header = element.querySelector('.id-card-header');
              const body = element.querySelector('.id-card-body');
              const terms = element.querySelector('.terms-section');
              const signature = element.querySelector('.signature-section');
              
              if (header) header.style.display = 'flex';
              if (body) body.style.display = 'flex';
              if (terms) terms.style.display = 'block';
              if (signature) signature.style.display = 'flex';
            }
          });
        }
      };

      // Capture both sides
      const frontCanvas = await html2canvas(frontElement, { ...options, width: frontRect.width, height: frontRect.height });
      const backCanvas = await html2canvas(backElement, { ...options, width: backRect.width, height: backRect.height });

      // Open print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Solo Parent ID</title>
            <style>
              @page {
                size: 3.375in 2.125in;
                margin: 0;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                img {
                  width: 3.375in;
                  height: 2.125in;
                  object-fit: contain;
                  page-break-after: always;
                  display: block;
                }
              }
            </style>
          </head>
          <body>
            <img src="${frontCanvas.toDataURL('image/png', 1.0)}" />
            <img src="${backCanvas.toDataURL('image/png', 1.0)}" />
          </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Error printing ID:', error);
      alert('Failed to print ID. Please try again.');
    }
  };

  const filteredUsers = verifiedUsers.filter(user => {
    if (!user) return false;
    
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (user.id && user.id.toString().includes(searchLower)) ||
      (user.code_id && user.code_id.toLowerCase().includes(searchLower)) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.age && user.age.toString().includes(searchLower))
    );

    // Barangay filter
    const matchesBarangay = selectedBarangay === 'All' || user.barangay === selectedBarangay;

    // Status filter
    let matchesStatus = true;
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'pending_remarks':
          matchesStatus = user.status === 'Pending Remarks';
          break;
        case 'terminated':
          matchesStatus = user.status === 'Terminated';
          break;
        case 'renewal':
          // Only show if user is Renewal AND their barangay_cert_documents status is Pending
          matchesStatus = user.status === 'Renewal' && user.documents && user.documents.some(doc => doc.document_type === 'barangay_cert_documents' && doc.status === 'Pending');
          break;
        case 'beneficiaries':
          // Only show verified users as beneficiaries
          if (user.status !== 'Verified') {
            matchesStatus = false;
            break;
          }
          
          // Convert income string to number for comparison
          const income = user.income;
          let incomeValue = 0;
          
          // If income is a direct number from database, use it directly
          if (!isNaN(income)) {
            incomeValue = parseFloat(income);
          } else {
            // Handle text-based income ranges
            if (income === 'Below ₱10,000') {
              incomeValue = 10000;
            } else if (income === '₱11,000-₱20,000') {
              incomeValue = 20000;
            } else if (income === '₱21,000-₱43,000') {
              incomeValue = 43000;
            } else if (income === '₱44,000 and above') {
              incomeValue = 250001; // Set high value to ensure no benefits
            }
          }
          
          // Only show benefits badge if income is strictly less than 250000
          matchesStatus = incomeValue < 250001;
          break;
        default:
          matchesStatus = true;
      }
    }

    return matchesSearch && matchesBarangay && matchesStatus;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;

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

  const openIDModal = (user) => {
    setSelectedIDUser(user);
    setShowIDModal(true);
  };

  const closeIDModal = () => {
    setShowIDModal(false);
    setSelectedIDUser(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="solo-parent-container">
      <div className="header-section">
        <h1 className="section-title">Solo Parent Management</h1>
        <div className="filter-container">
          <div className="barangay-filter">
            <select 
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="barangay-select"
            >
              {barangays.map(barangay => (
                <option key={barangay} value={barangay}>
                  {barangay === 'All' ? 'All Barangays' : barangay}
                </option>
              ))}
            </select>
          </div>
          <div className="status-filter">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
      </div>

      <div 
        ref={tableContainerRef}
        className={`table-container ${isTableScrollable ? 'has-scroll' : ''}`}
      >
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Code ID</th>
              <th>Name</th>
              <th>Barangay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={index}>
                <td>{indexOfFirstUser + index + 1}</td>
                <td>{user.code_id}</td>
                <td>{`${user.first_name} ${user.middle_name || ''} ${user.last_name}`}</td>
                <td>{user.barangay || 'N/A'}</td>
                <td>{user.status}</td>
                <td>
                  <button className="btn view-btn" onClick={() => openModal(user)}> 
                    <i className="fas fa-eye"></i> View
                  </button>
                  {user.status === 'Verified' && (
                    <button className="btn download-btn" onClick={() => openIDModal(user)}>
                      <i className="fas fa-download"></i> Download ID
                    </button>
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

      {/* VIEW DETAILS MODAL */}
      {selectedUser && (
        <div 
          className="solo-parent-modal-overlay" 
          onClick={closeModal}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="solo-parent-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="solo-parent-modal-header">
              <h3>Solo Parent Details</h3>
            </div>
            <div className="solo-parent-modal-content">
              {selectedUser.status === 'Pending Remarks' ? (
                <div className="detail-section">
                  <h4>Remarks Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedUser.code_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Barangay</span>
                      <span className="value">{selectedUser.barangay}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Remarks</span>
                      <span className="value remarks-text">{selectedUser.latest_remarks || 'No remarks'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date</span>
                      <span className="value">{formatDate(selectedUser.remarks_at)}</span>
                    </div>
                  </div>
                  <div className="modal-buttons">
                    <button 
                      onClick={() => handleAccept(selectedUser.code_id)} 
                      className="accept-btn"
                    >
                      Re-verify Account
                    </button>
                    <button 
                      onClick={() => handleDecline(selectedUser.code_id)} 
                      className="decline-btn"
                    >
                      Terminate Account
                    </button>
                  </div>
                </div>
              ) : selectedUser.status === 'Terminated' ? (
                <div className="detail-section">
                  <h4>Terminated User Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedUser.code_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Barangay</span>
                      <span className="value">{selectedUser.barangay}</span>
                    </div>
                  </div>
                  <div className="modal-buttons">
                    <button 
                      onClick={() => handleUnterminate(selectedUser.userId)} 
                      className="accept-btn"
                    >
                      Re-verify Account
                    </button>
                  </div>
                </div>
              ) : selectedUser.status === 'Renewal' ? (
                <div className="detail-section">
                  <h4>Renewal Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Code ID</span>
                      <span className="value">{selectedUser.code_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">
                        {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Barangay</span>
                      <span className="value">{selectedUser.barangay}</span>
                    </div>
                  </div>
                  <div className="documents-section">
                    <h4>Barangay Certificate</h4>
                    {(() => {
  const certDocs = selectedUser.documents ? selectedUser.documents.filter(doc => doc.document_type === 'barangay_cert_documents') : [];
  if (certDocs.length > 0) {
    return (
      <div className="documents-list">
        {certDocs.map((doc, index) => (
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
    );
  } else {
    let message = "No barangay certificate submitted yet.";
    if (
      selectedUser.latest_remarks &&
      selectedUser.latest_remarks.toLowerCase().includes("declined")
    ) {
      message = "Barangay certificate was removed after renewal was declined.";
    }
    return (
      <div className="no-documents">
        <p>{message}</p>
      </div>
    );
  }
})()}
                  </div>
                  <div className="modal-buttons">
                    <button
                       onClick={() => handleAction("Accept", selectedUser)}
                       className="accept-btn"
                       disabled={!(selectedUser.documents && selectedUser.documents.filter(doc => doc.document_type === 'barangay_cert_documents').length > 0)}
                     >
                       Accept Renewal
                     </button>
                    <button 
                      onClick={() => handleAction("Decline", selectedUser)} 
                      className="decline-btn"
                    >
                      Decline Renewal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="step-indicators">
                    {[1, 2, 3, 4, 5, 6].map(step => (
                      <div
                        key={step}
                        className={`step-dot ${stepPage === step ? 'active' : ''}`}
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
                            {`${selectedUser.first_name || ''} ${selectedUser.middle_name || ''} ${selectedUser.last_name || ''}`}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Age</span>
                          <span className="value">{selectedUser.age || ''}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Gender</span>
                          <span className="value">{selectedUser.gender || ''}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Date of Birth</span>
                          <span className="value">{formatDate(selectedUser.date_of_birth)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Place of Birth</span>
                          <span className="value">{selectedUser.place_of_birth}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Barangay</span>
                          <span className="value">{selectedUser.barangay}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Email</span>
                          <span className="value">{selectedUser.email}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Contact Number</span>
                          <span className="value">{selectedUser.contact_number}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Education</span>
                          <span className="value">{selectedUser.education}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Occupation</span>
                          <span className="value">{selectedUser.occupation}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Company</span>
                          <span className="value">{selectedUser.company}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Income</span>
                          <span className="value">{selectedUser.income}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Employment Status</span>
                          <span className="value">{selectedUser.employment_status}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Civil Status</span>
                          <span className="value">{selectedUser.civil_status}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Religion</span>
                          <span className="value">{selectedUser.religion}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Pantawid Beneficiary</span>
                          <span className="value">{selectedUser.pantawid_beneficiary}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Indigenous</span>
                          <span className="value">{selectedUser.indigenous}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Code ID</span>
                          <span className="value">{selectedUser.code_id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 2 && (
                    <div className="detail-section">
                      <h4>Family Information</h4>
                      {selectedUser.familyMembers && selectedUser.familyMembers.length > 0 ? (
                        <div className="children-list">
                          {selectedUser.familyMembers.map((member, index) => (
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
                          <span className="value">{selectedUser.classification}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 4 && (
                    <div className="detail-section">
                      <h4>Needs/Problems</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">Details</span>
                          <span className="value">{selectedUser.needs_problems}</span>
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
                          <span className="value">{selectedUser.emergency_name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Relationship</span>
                          <span className="value">{selectedUser.emergency_relationship}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Address</span>
                          <span className="value">{selectedUser.emergency_address}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Contact Number</span>
                          <span className="value">{selectedUser.emergency_contact}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {stepPage === 6 && (
                    <div className="detail-section">
                      <h4>Documents</h4>
                      {selectedUser.documents && selectedUser.documents.length > 0 ? (
                        <div className="documents-list">
                          {selectedUser.documents.map((doc, index) => {
                            const displayType = doc.document_type ? 
                              doc.document_type.replace('_documents', '').toUpperCase() : 'Document';
                            
                            return (
                              <div key={index} className="document-item">
                                <div className="document-header">
                                  <h5>{displayType}</h5>
                                </div>
                                <div className="document-preview">
                                  <img 
                                    src={doc.file_url} 
                                    alt={doc.display_name || displayType}
                                    className="document-thumbnail"
                                    onClick={() => window.open(doc.file_url, '_blank')}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Image+Not+Found";
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
                            );
                          })}
                        </div>
                      ) : (
                        <p>No documents available.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              {selectedUser.status !== 'Pending Remarks' && selectedUser.status !== 'Terminated' && selectedUser.status !== 'Renewal' && (
                <>
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
                    ) : null}
                  </div>
                </>
              )}
              <button className="btn view-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-content">
              <i className="fas fa-check-circle"></i>
              <p>{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIDModal && (
        <div className="id-modal-overlay" onClick={closeIDModal}>
          <div className="id-modal" onClick={(e) => e.stopPropagation()}>
            <div className="id-modal-header">
              <h3>Solo Parent ID Card</h3>
              <button 
                className="close-btn"
                onClick={closeIDModal}
              >
                &times;
              </button>
            </div>
            <div className="id-modal-content">
              <div className="id-cards-container">
                {/* Front of ID */}
                <div className="id-card front">
                  <div className="id-card-header">
                    <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                    <div className="id-title">
                      <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                      <h4>Republic of the Philippines</h4>
                      <h4>DSWD Region III</h4>
                    </div>
                  </div>
                  <div className="id-card-body">
                    <div className="id-left-section">
                      <div className="id-photo-container">
                        <img 
                          src={selectedIDUser.profilePic || selectedIDUser.profile_picture || avatar} 
                          alt="User" 
                          className="id-photo"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = avatar;
                          }}
                        />
                      </div>
                      <div className="id-category">
                        Category: {selectedIDUser.classification}
                      </div>
                      <div className="id-validity">
                        Valid Until: {selectedIDUser.validUntil}
                      </div>
                    </div>
                    <div className="id-card-container">
                      <div className="id-card-details">
                        <div className="id-detail">
                          <span className="id-label">ID No:</span>
                          <span className="id-value">{selectedIDUser.code_id || 'N/A'}</span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Name:</span>
                          <span className="id-value">
                            {`${selectedIDUser.first_name || ''} ${selectedIDUser.middle_name || ''} ${selectedIDUser.last_name || ''}`}
                          </span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Barangay:</span>
                          <span className="id-value">{selectedIDUser.barangay || 'N/A'}</span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Birthdate:</span>
                          <span className="id-value">
                            {selectedIDUser.date_of_birth ? new Date(selectedIDUser.date_of_birth).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Civil Status:</span>
                          <span className="id-value">{selectedIDUser.civil_status || 'N/A'}</span>
                        </div>
                        <div className="id-detail">
                          <span className="id-label">Contact:</span>
                          <span className="id-value">{selectedIDUser.contact_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="id-card-qr-container">
                        <QRCodeSVG 
                          value={`user:${selectedIDUser?.userId}`}
                          size={120}
                          level="H"
                          includeMargin={true}
                          fgColor="#2E7D32"
                          bgColor="#ffffff"
                        />
                      
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of ID */}
                <div className="id-card back">
                  <div className="id-card-header">
                    <img src={dswdLogo} alt="DSWD Logo" className="id-logo" />
                    <div className="id-title">
                      <h3>SOLO PARENT IDENTIFICATION CARD</h3>
                      <h4>Republic of the Philippines</h4>
                      <h4>DSWD Region III</h4>
                    </div>
                  </div>
                  <div className="terms-section">
                    <h3>Terms and Conditions</h3>
                    <ol>
                      <li>This ID is non-transferable</li>
                      <li>Report loss/damage to DSWD office</li>
                      <li>Present this ID when availing benefits</li>
                      <li>Tampering invalidates this ID</li>
                    </ol>
                  </div>
                  <div className="signature-section">
                    <div className="signature-block">
                      <div className="signature-line"></div>
                      <span>Card Holder's Signature</span>
                    </div>
                    <div className="signature-block">
                      <div className="signature-line"></div>
                      <span>Authorized DSWD Official</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="id-modal-actions">
              <button 
                className="download-btn"
                onClick={() => downloadID('front')}
              >
                Download Front
              </button>
              <button 
                className="download-btn"
                onClick={() => downloadID('back')}
              >
                Download Back
              </button>
              <button 
                className="print-btn"
                onClick={printID}
              >
                Print ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoloParentManagement; 