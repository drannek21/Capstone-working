import React, { useState, useEffect } from 'react';
import './Applications.css';

const Applications = () => {
  const [applications, setApplications] = useState([
    {
      firstName: "John",
      middleName: "A.",
      lastName: "Doe",
      age: "30",
      gender: "Male",
      dateOfBirth: "1991-01-01",
      placeOfBirth: "New York",
      address: "1234 Elm Street",
      education: "Bachelor's Degree",
      civilStatus: "Single",
      occupation: "Software Engineer",
      religion: "Christian",
      company: "Tech Corp",
      income: "$60,000",
      employmentStatus: "Full-time",
      contactNumber: "1234567890",
      email: "john@example.com",
      pantawidBeneficiary: "Yes",
      indigenous: "No",
    },
    {
      firstName: "Jane",
      middleName: "B.",
      lastName: "Smith",
      age: "28",
      gender: "Female",
      dateOfBirth: "1993-05-15",
      placeOfBirth: "Los Angeles",
      address: "5678 Oak Avenue",
      education: "Master's Degree",
      civilStatus: "Married",
      occupation: "Product Manager",
      religion: "Hindu",
      company: "Design Inc.",
      income: "$75,000",
      employmentStatus: "Part-time",
      contactNumber: "9876543210",
      email: "jane@example.com",
      pantawidBeneficiary: "No",
      indigenous: "Yes",
    },
  ]);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [modalType, setModalType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    return (
      app.firstName.toLowerCase().includes(searchLower) ||
      app.lastName.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower)
    );
  });

  // Sort applications
  const sortedApplications = React.useMemo(() => {
    let sortable = [...filteredApplications];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [filteredApplications, sortConfig]);

  // Get current page applications
  const indexOfLastApp = currentPage * applicationsPerPage;
  const indexOfFirstApp = indexOfLastApp - applicationsPerPage;
  const currentApplications = sortedApplications.slice(indexOfFirstApp, indexOfLastApp);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const openModal = (application, type) => {
    setSelectedApplication(application);
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

  const handleAction = (action, application = null) => {
    const target = application || selectedApplication;
    if (!target) return;

    if (action === "Decline" && !remarks && modalType === "decline") {
      alert("Please provide remarks for declining.");
      return;
    }

    // Here you would typically make an API call
    setApplications(apps => apps.filter(app => app.email !== target.email));
    closeModal();
  };

  const userDetailSections = [
    {
      title: "Personal Information",
      fields: [
        { label: "First Name", key: "firstName" },
        { label: "Middle Name", key: "middleName" },
        { label: "Last Name", key: "lastName" },
        { label: "Age", key: "age" },
        { label: "Gender", key: "gender" },
        { label: "Date of Birth", key: "dateOfBirth" },
        { label: "Place of Birth", key: "placeOfBirth" },
      ]
    },
    {
      title: "Contact Information",
      fields: [
        { label: "Address", key: "address" },
        { label: "Contact Number", key: "contactNumber" },
        { label: "Email", key: "email" },
      ]
    },
    {
      title: "Professional Information",
      fields: [
        { label: "Education", key: "education" },
        { label: "Occupation", key: "occupation" },
        { label: "Company", key: "company" },
        { label: "Income", key: "income" },
        { label: "Employment Status", key: "employmentStatus" },
      ]
    },
    {
      title: "Other Information",
      fields: [
        { label: "Civil Status", key: "civilStatus" },
        { label: "Religion", key: "religion" },
        { label: "Pantawid Beneficiary", key: "pantawidBeneficiary" },
        { label: "Indigenous", key: "indigenous" },
      ]
    }
  ];

  const MobileApplicationCard = ({ application }) => (
    <div className="application-card">
      <div className="application-info">
        <h3>{application.firstName} {application.lastName}</h3>
        <p className="email">{application.email}</p>
        <p className="details">
          <span>{application.age} years old</span> • 
          <span>{application.occupation}</span>
        </p>
      </div>
      <div className="application-actions">
        <button className="btn view-btn" onClick={() => openModal(application, "view")}>
          <i className="fas fa-eye"></i> View
        </button>
        <button className="btn accept-btn" onClick={() => handleAction("Accept", application)}>
          <i className="fas fa-check"></i> Accept
        </button>
        <button className="btn decline-btn" onClick={() => openModal(application, "decline")}>
          <i className="fas fa-times"></i> Decline
        </button>
      </div>
    </div>
  );

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h2>Application Management</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {isMobile ? (
        <div className="mobile-applications">
          {currentApplications.map((app, index) => (
            <MobileApplicationCard key={index} application={app} />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('firstName')}>
                  Name {sortConfig.key === 'firstName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </th>
                <th onClick={() => requestSort('email')}>
                  Email {sortConfig.key === 'email' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </th>
                <th onClick={() => requestSort('age')}>
                  Age {sortConfig.key === 'age' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentApplications.map((app, index) => (
                <tr key={index}>
                  <td>{app.firstName} {app.lastName}</td>
                  <td>{app.email}</td>
                  <td>{app.age}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn view-btn" onClick={() => openModal(app, "view")}>
                        <i className="fas fa-eye"></i> View
                      </button>
                      <button className="btn accept-btn" onClick={() => handleAction("Accept", app)}>
                        <i className="fas fa-check"></i> Accept
                      </button>
                      <button className="btn decline-btn" onClick={() => openModal(app, "decline")}>
                        <i className="fas fa-times"></i> Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedApplications.length > applicationsPerPage && (
        <div className="pagination">
          {Array.from({ length: Math.ceil(sortedApplications.length / applicationsPerPage) }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {modalType === "view" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              {userDetailSections.map((section, idx) => (
                <div key={idx} className="detail-section">
                  <h4>{section.title}</h4>
                  <div className="details-grid">
                    {section.fields.map((field, fieldIdx) => (
                      <div key={fieldIdx} className="detail-item">
                        <span className="label">{field.label}:</span>
                        <span className="value">{selectedApplication[field.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn accept-btn" onClick={() => handleAction("Accept")}>
                <i className="fas fa-check"></i> Accept
              </button>
              <button className="btn decline-btn" onClick={() => openModal(selectedApplication, "decline")}>
                <i className="fas fa-times"></i> Decline
              </button>
              <button className="btn close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modalType === "decline" && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Decline Application</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <div className="remarks-section">
                <label>
                  Reason for declining:
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter your remarks here..."
                    required
                  />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn decline-btn" onClick={() => handleAction("Decline")}>
                <i className="fas fa-times"></i> Confirm Decline
              </button>
              <button className="btn cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
