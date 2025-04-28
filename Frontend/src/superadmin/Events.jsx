import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Events.css';
import { FaTimes, FaQrcode } from 'react-icons/fa';
import QrScanner from 'qr-scanner';
import santaMariaBarangays from '../data/santaMariaBarangays.json';

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
    visibility: 'everyone',
    barangay: 'All'
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
  const [showTimeConflictModal, setShowTimeConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const loggedInUserId = localStorage.getItem('UserId');

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
      const response = await axios.get(`http://localhost:8081/api/events?userId=${loggedInUserId}`);
      if (response.data) {
        setEvents(response.data);
        console.log('Events fetched:', response.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setStatusMessage('Failed to fetch events');
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
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatBufferTimeMessage = (event, bufferStart, bufferEnd) => {
    // Strip seconds from time display
    const eventStartTime = formatTime(event.startTime);
    const eventEndTime = formatTime(event.endTime);
    
    // Convert buffer times from minutes to HH:mm format
    const formatMinutesToTime = (minutes) => {
      if (typeof minutes !== 'number' || isNaN(minutes)) return '--:--';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const bufferStartTime = formatMinutesToTime(bufferStart);
    const bufferEndTime = formatMinutesToTime(bufferEnd);

    return `There must be a 1-hour gap between events. Event "${event.title}" runs from ${eventStartTime} to ${eventEndTime}, blocking the time slot from ${bufferStartTime} to ${bufferEndTime}.`;
  };

  const checkTimeConflict = async (newStartDate, newEndDate, newStartTime, newEndTime, excludeEventId = null) => {
    try {
      // Validate input times
      if (!newStartTime || !newEndTime) {
        return {
          hasConflict: true,
          conflictingEvent: null,
          message: 'Please select both start and end times'
        };
      }

      const response = await axios.get('http://localhost:8081/api/events');
      const existingEvents = response.data.filter(event => 
        event.id !== excludeEventId &&
        event.startDate.split('T')[0] === newStartDate.split('T')[0]
      );

      // Convert times to minutes for easier comparison, handling HH:mm:ss format
      const parseTimeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
      };

      const newStart = parseTimeToMinutes(newStartTime);
      const newEnd = parseTimeToMinutes(newEndTime);

      if (newStart === null || newEnd === null) {
        return {
          hasConflict: true,
          conflictingEvent: null,
          message: 'Invalid time format'
        };
      }

      // Check each existing event for overlap including 1-hour buffer
      for (const event of existingEvents) {
        const existingStart = parseTimeToMinutes(event.startTime);
        const existingEnd = parseTimeToMinutes(event.endTime);
        
        if (existingStart === null || existingEnd === null) {
          continue; // Skip invalid events
        }

        // Add 1-hour buffer before and after existing events
        const bufferStart = existingStart - 60; // 1 hour before event starts
        const bufferEnd = existingEnd + 60;    // 1 hour after event ends

        // Check if there's any overlap including buffer time
        if ((newStart >= bufferStart && newStart < bufferEnd) || 
            (newEnd > bufferStart && newEnd <= bufferEnd) ||
            (newStart <= bufferStart && newEnd >= bufferEnd)) {
          return {
            hasConflict: true,
            conflictingEvent: event,
            message: formatBufferTimeMessage(event, bufferStart, bufferEnd)
          };
        }
      }

      return {
        hasConflict: false,
        conflictingEvent: null,
        message: null
      };
    } catch (error) {
      console.error('Error checking time conflicts:', error);
      return {
        hasConflict: false,
        conflictingEvent: null,
        message: null
      };
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    let value = e.target.value;
    console.log(`Input changed - name: ${name}, value: ${value}`);

    if (name === 'startDate' || name === 'endDate') {
      // Validate dates
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.error('Cannot select a past date');
        return;
      }

      if (name === 'endDate' && value < formData.startDate) {
        toast.error('End date cannot be before start date');
        return;
      }
    }

    if (name === 'startTime' || name === 'endTime') {
      // Convert from 12-hour to 24-hour format if needed
      if (value.includes('AM') || value.includes('PM')) {
        value = convertTo24Hour(value);
      }

      // Validate times
      if (formData.startDate && formData.startDate === formData.endDate) {
        const startMinutes = name === 'startTime' ? timeToMinutes(value) : timeToMinutes(formData.startTime);
        const endMinutes = name === 'endTime' ? timeToMinutes(value) : timeToMinutes(formData.endTime);

        if (startMinutes && endMinutes && endMinutes <= startMinutes) {
          toast.error('End time must be after start time');
          return;
        }
      }
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('Updated form data:', newData);
      return newData;
    });
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      // Validate end time is after start time
      const startMinutes = timeToMinutes(formData.startTime);
      const endMinutes = timeToMinutes(formData.endTime);
      
      if (endMinutes <= startMinutes) {
        toast.error('End time must be after start time');
        return;
      }

      const eventData = { ...formData };
      const response = await axios.post('http://localhost:8081/api/events', eventData);
      
      if (response.data) {
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
          visibility: 'everyone',
          barangay: 'All'
        });
        fetchEvents();
      }
    } catch (error) {
      console.error('Error adding event:', error);
      if (error.response?.data?.error === 'Time Conflict' && error.response?.data?.conflictingEvent) {
        setConflictInfo(error.response.data.conflictingEvent);
        setShowTimeConflictModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add event');
      }
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    try {
      // Validate end time is after start time
      const startMinutes = timeToMinutes(formData.startTime);
      const endMinutes = timeToMinutes(formData.endTime);
      
      if (endMinutes <= startMinutes) {
        toast.error('End time must be after start time');
        return;
      }

      const eventData = { ...formData };
      const response = await axios.put(`http://localhost:8081/api/events/${selectedEvent.id}`, eventData);
      
      if (response.data) {
        toast.success('Event updated successfully');
        setShowEditModal(false);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          location: '',
          status: 'Upcoming',
          visibility: 'everyone',
          barangay: 'All'
        });
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      if (error.response?.data?.error === 'Time Conflict' && error.response?.data?.conflictingEvent) {
        setConflictInfo(error.response.data.conflictingEvent);
        setShowTimeConflictModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update event');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:8081/api/events/${id}`);
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
      visibility: event.visibility,
      barangay: event.barangay
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

  // Time conflict modal component
  const TimeConflictModal = () => {
    if (!showTimeConflictModal || !conflictInfo) return null;

    return (
      <div className="modal-overlay">
        <div className="time-conflict-modal">
          <div className="modal-header warning">
            <h5 className="modal-title">
              <i className="fas fa-exclamation-triangle"></i>
              Time Conflict Detected
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={() => setShowTimeConflictModal(false)}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            <div className="conflict-details">
              <h6 className="mb-3">Existing Event:</h6>
              <div className="event-info-card">
                <div className="event-info-item">
                  <span className="event-info-label">Title:</span>
                  <span>{conflictInfo.title}</span>
                </div>
                <div className="event-info-item">
                  <span className="event-info-label">Time:</span>
                  <span>{formatTime(conflictInfo.startTime)} - {formatTime(conflictInfo.endTime)}</span>
                </div>
                <div className="event-info-item">
                  <span className="event-info-label">Date:</span>
                  <span>{formatDate(conflictInfo.startDate)}</span>
                </div>
                <div className="event-info-item mb-0">
                  <span className="event-info-label">Location:</span>
                  <span>{conflictInfo.location}</span>
                </div>
              </div>
              <div className="warning-box">
                <p className="warning-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  There must be a 1-hour gap between events.
                </p>
                <p className="mb-2">Please select a time that is:</p>
                <ul className="time-suggestions">
                  <li className="time-suggestion-item">
                    <i className="fas fa-clock"></i>
                    At least 1 hour after the existing event ends ({formatTime(conflictInfo.endTime)} + 1 hour)
                  </li>
                  <li className="time-suggestion-item mb-0">
                    <i className="fas fa-clock"></i>
                    OR at least 1 hour before the existing event starts ({formatTime(conflictInfo.startTime)} - 1 hour)
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="close-button"
              onClick={() => setShowTimeConflictModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

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
              <th>Barangay</th>
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
                <td>{event.barangay || 'All'}</td>
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
                  step="900"
                />
                <span className="time-format">{formData.startTime ? formatTime(formData.startTime) : ''}</span>
              </div>
              <div className="events-form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  step="900"
                />
                <span className="time-format">{formData.endTime ? formatTime(formData.endTime) : ''}</span>
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
                <label>Barangay</label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "All" : e.target.value;
                    console.log("Barangay dropdown changed to:", value);
                    console.log("Previous formData:", formData);
                    handleInputChange({
                      target: {
                        name: "barangay",
                        value: value
                      }
                    });
                  }}
                  required
                >
                  <option value="">Select Barangay</option>
                  {santaMariaBarangays.Barangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                  <option value="All">All</option>
                </select>
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
                <label>Barangay</label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "All" : e.target.value;
                    console.log("Barangay dropdown changed to:", value);
                    console.log("Previous formData:", formData);
                    handleInputChange({
                      target: {
                        name: "barangay",
                        value: value
                      }
                    });
                  }}
                  required
                >
                  <option value="">Select Barangay</option>
                  {santaMariaBarangays.Barangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                  <option value="All">All</option>
                </select>
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

      <TimeConflictModal />
    </div>
  );
};

export default Events;