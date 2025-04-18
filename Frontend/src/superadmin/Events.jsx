import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Events.css';
import { FaTimes, FaQrcode } from 'react-icons/fa';
import QrScanner from 'qr-scanner';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    status: 'Upcoming',
    visibility: 'everyone'
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [attendeesList, setAttendeesList] = useState([]);
  const [completedEventAttendees, setCompletedEventAttendees] = useState([]);
  const [showCompletedEventModal, setShowCompletedEventModal] = useState(false);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  // Add debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        try {
          console.log('Searching for:', searchTerm);
          const response = await axios.get(`http://localhost:8081/api/users/search?q=${searchTerm}`);
          console.log('Search response:', response.data);
          
          // Filter only verified users
          const verifiedUsers = response.data.filter(user => 
            user.status === 'Verified' || user.status === 'verified' || user.status === 'VERIFIED'
          );
          
          console.log('Verified users:', verifiedUsers);
          
          if (verifiedUsers.length === 0) {
            setSearchMessage('User not found');
            setSearchResults([]);
          } else {
            setSearchMessage('');
            setSearchResults(verifiedUsers);
          }
        } catch (error) {
          console.error('Search error details:', error.response?.data || error.message);
          setSearchResults([]);
          setSearchMessage('User not found');
        }
      } else {
        setSearchResults([]);
        setSearchMessage('');
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:8081/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchEventAttendees = async (eventId) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/events/${eventId}/attendees`);
      if (response.data) {
        setAttendeesList(response.data);
        setCompletedEventAttendees(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast.error('Failed to fetch attendees');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8081/events', formData);
      toast.success('Event added successfully');
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        status: 'Upcoming',
        visibility: 'everyone'
      });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8081/events/${selectedEvent.id}`, formData);
      toast.success('Event updated successfully');
      setShowEditModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:8081/events/${id}`);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleEditClick = (e, event) => {
    e.stopPropagation();
    if (event.status === 'Completed') {
      toast.error('Completed events cannot be edited');
      return;
    }
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      status: event.status,
      visibility: event.visibility || 'everyone'
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (e, eventId) => {
    e.stopPropagation();
    handleDeleteEvent(eventId);
  };

  const handleEventClick = (event) => {
    if (event.status === 'Completed') {
      setSelectedEventTitle(event.title);
      setCurrentEventId(event.id);
      fetchEventAttendees(event.id);
      setShowCompletedEventModal(true);
      return;
    }

    if (!['Active', 'Ongoing'].includes(event.status)) {
      setStatusMessage(`Attendee management is not available for ${event.status.toLowerCase()} events`);
      setShowStatusModal(true);
      return;
    }
    setCurrentEventId(event.id);
    setShowAttendeesModal(true);
    fetchEventAttendees(event.id);
  };

  const addAttendee = async (userId) => {
    try {
      const response = await axios.post(`http://localhost:8081/api/events/${currentEventId}/attendees`, { userId });
      toast.success('Attendee added successfully');
      setAttendeesList(response.data.attendees);
      // Clear search results after adding
      setSearchResults([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding attendee:', error);
      toast.error(error.response?.data?.error || 'Failed to add attendee');
    }
  };

  const handleQRCodeScan = async () => {
    try {
      setScannerError('');
      setShowScanner(true);
      
      // Ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      const videoElem = document.getElementById('qr-scanner-video');
      
      if (!videoElem) {
        throw new Error('Scanner elements not found');
      }

      // Configure video element
      videoElem.playsInline = true;
      videoElem.muted = true;
      
      // Get camera stream with fallback
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      }).catch(async () => {
        // Fallback to any available camera
        return navigator.mediaDevices.getUserMedia({
          video: true
        });
      });

      if (!stream) {
        throw new Error('No camera available');
      }
      
      videoElem.srcObject = stream;
      await videoElem.play().catch(err => {
        throw new Error('Failed to start video feed: ' + err.message);
      });
      
      // Scanning logic
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let scanAttempts = 0;
      let lastScanTime = 0;
      
      const scanInterval = setInterval(async () => {
        try {
          const now = Date.now();
          if (now - lastScanTime < 200) { // Limit scan rate to 5 times per second
            return;
          }
          lastScanTime = now;

          if (scanAttempts++ > 300) { // 60 second timeout
            clearInterval(scanInterval);
            stream.getTracks().forEach(track => track.stop());
            throw new Error('Scan timed out - please try again');
          }
          
          if (!videoElem.videoWidth) {
            return; // Skip if video not ready
          }

          canvas.width = videoElem.videoWidth;
          canvas.height = videoElem.videoHeight;
          context.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
          
          const result = await QrScanner.scanImage(canvas).catch(() => null);
          if (result) {
            clearInterval(scanInterval);
            // Get the QR code data directly
            const qrData = result.trim();
            
            // Get user details by searching with qr_code_data
            try {
              const response = await axios.get(`http://localhost:8081/api/users/search/qr?qr_code_data=${qrData}`);
              if (response.data.success) {
                // Set the search input to the user's name
                setSearchTerm(response.data.user.name);
                // Optionally trigger search automatically:
                // handleSearch({ preventDefault: () => {} });
                toast.success(`Found user: ${response.data.user.name}`);
              } else {
                toast.error(response.data.error || 'User not found');
              }
            } catch (error) {
              console.error('Error searching user:', error);
              toast.error('Failed to search user');
            }
            
            // Cleanup
            stream.getTracks().forEach(track => track.stop());
            setShowScanner(false);
          }
        } catch (err) {
          // Only stop on actual errors, not failed scans
          if (err.message !== 'QR code not found') {
            clearInterval(scanInterval);
            stream.getTracks().forEach(track => track.stop());
            setScannerError(err.message);
            setShowScanner(false);
          }
        }
      }, 200); // Scan every 200ms
      
      // Cleanup function
      return () => {
        clearInterval(scanInterval);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
    } catch (err) {
      console.error('QR Scanner error:', err);
      setScannerError(err.message || 'Failed to initialize camera');
      setShowScanner(false);
    }
  };

  // QR Scanner Modal Component
  const QRScannerModal = () => (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        <div className="scanner-header">
          <h2>Scan QR Code</h2>
          {scannerError ? (
            <p className="scanner-error-message">{scannerError}</p>
          ) : (
            <p className="scanner-instructions">Position the QR code within the frame</p>
          )}
        </div>
        
        <div className="scanner-container">
          <div className="scanner-frame">
            <video 
              id="qr-scanner-video"
              className={`scanner-video ${scannerError ? 'scanner-error-state' : ''}`}
            />
            <div className="scanner-corner top-left"></div>
            <div className="scanner-corner top-right"></div>
            <div className="scanner-corner bottom-left"></div>
            <div className="scanner-corner bottom-right"></div>
          </div>
        </div>

        <div className="scanner-footer">
          <button 
            className="cancel-scan-btn"
            onClick={() => {
              const videoElem = document.getElementById('qr-scanner-video');
              if (videoElem && videoElem.srcObject) {
                videoElem.srcObject.getTracks().forEach(track => track.stop());
              }
              setShowScanner(false);
              setScannerError('');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>Events Management</h2>
        <button className="events-add-btn" onClick={() => setShowAddModal(true)}>
          Add New Event
        </button>
      </div>

      <div className="events-table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr 
                key={event.id} 
                onClick={() => handleEventClick(event)}
                className="event-row"
              >
                <td>{event.title}</td>
                <td>
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </td>
                <td>
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </td>
                <td>{event.location}</td>
                <td>
                  <span className={`events-status-badge ${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={(e) => handleEditClick(e, event)}
                    className={`events-edit-btn ${event.status === 'Completed' ? 'disabled' : ''}`}
                    disabled={event.status === 'Completed'}
                    style={{ 
                      opacity: event.status === 'Completed' ? 0.5 : 1,
                      cursor: event.status === 'Completed' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(e, event.id)}
                    className="events-delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="events-modal">
          <div className="events-modal-content">
            <h3>Add New Event</h3>
            <form onSubmit={handleAddEvent}>
              <div className="events-form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  min={formData.startDate}
                />
              </div>
              <div className="events-form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="events-form-group">
                <label>Visibility</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  required
                >
                  <option value="everyone">Show to Everyone</option>
                  <option value="beneficiaries">Beneficiaries</option>
                  <option value="not_beneficiaries">Not Beneficiaries</option>
                </select>
              </div>
              <div className="events-modal-actions">
                <button 
                  type="button" 
                  className="events-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="events-save-btn"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="events-modal">
          <div className="events-modal-content">
            <h3>Edit Event</h3>
            <form onSubmit={handleEditEvent}>
              <div className="events-form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Start Date & Time</label>
                <div className="date-time-inputs">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="events-form-group">
                <label>End Date & Time</label>
                <div className="date-time-inputs">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate}
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="events-form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="events-form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="events-form-group">
                <label>Visibility</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  required
                >
                  <option value="everyone">Show to Everyone</option>
                  <option value="beneficiaries">Beneficiaries</option>
                  <option value="not_beneficiaries">Not Beneficiaries</option>
                </select>
              </div>
              <div className="events-modal-actions">
                <button 
                  type="button" 
                  className="events-cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="events-save-btn"
                >
                  Update Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {showAttendeesModal && (
        <div className="event-attendees-backdrop" onClick={() => setShowAttendeesModal(false)}>
          <div className="event-attendees-modal" onClick={e => e.stopPropagation()}>
            <div className="event-attendees-header">
            <h3>Manage Attendees for Event #{currentEventId}</h3>
              <button 
                className="event-attendees-close" 
                onClick={() => setShowAttendeesModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="event-attendees-content">
              {/* Left side - Search and Add */}
              <div className="event-attendees-search-section">
                <div className="search-container">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email"
                    className="event-attendees-search-input"
                  />
                  <button 
                    onClick={handleQRCodeScan}
                    className="qr-scan-btn"
                    title="Scan QR Code"
                  >
                    <FaQrcode />
              </button>
                </div>
                
                {searchMessage && (
                  <div className="event-attendees-search-message" style={{ color: searchResults.length === 0 ? 'red' : 'green' }}>
                    {searchMessage}
                  </div>
                )}
                
            {searchResults.length > 0 && (
                  <div className="event-attendees-search-results">
                {searchResults.map(user => (
                      <div key={user.id} className="event-attendees-user-result">
                    <span>{user.name} ({user.email})</span>
                    <button 
                      onClick={() => addAttendee(user.id)}
                          className="event-attendees-add-btn"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
              </div>

              {/* Right side - Attendees Table */}
              <div className="event-attendees-table-section">
                <h4>Current Attendees</h4>
                <div className="event-attendees-table-container">
                  <table className="event-attendees-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Barangay</th>
                        <th>Attendance Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendeesList.map(attendee => (
                        <tr key={attendee.id}>
                          <td>{attendee.name}</td>
                          <td>{attendee.email}</td>
                          <td>{attendee.barangay}</td>
                          <td>{new Date(attendee.attend_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScanner && <QRScannerModal />}

      {/* Add Completed Event Attendees Modal */}
      {showCompletedEventModal && (
        <div className="event-attendees-backdrop" onClick={() => setShowCompletedEventModal(false)}>
          <div className="event-attendees-modal" onClick={e => e.stopPropagation()}>
            <div className="event-attendees-header">
              <h3>Attendees List - {selectedEventTitle}</h3>
              <button 
                className="event-attendees-close" 
                onClick={() => setShowCompletedEventModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="event-attendees-content">
              <div className="event-attendees-table-section">
                <div className="event-attendees-table-container">
                  <table className="event-attendees-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Barangay</th>
                        <th>Attendance Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedEventAttendees.map(attendee => (
                        <tr key={attendee.id}>
                          <td>{attendee.name}</td>
                          <td>{attendee.email}</td>
                          <td>{attendee.barangay}</td>
                          <td>{new Date(attendee.attend_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {completedEventAttendees.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center' }}>No attendees found for this event</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Restriction Modal */}
      {showStatusModal && (
        <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="status-modal" onClick={e => e.stopPropagation()}>
            <h3>Event Status Restriction</h3>
            <p>{statusMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;