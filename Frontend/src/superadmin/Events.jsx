import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Events.css';
import { FaTimes } from 'react-icons/fa';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    status: 'Upcoming'
  });
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:8081/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
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
        status: 'Upcoming'
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

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      status: event.status
    });
    setShowEditModal(true);
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
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
                  <button className="events-edit-btn" onClick={() => openEditModal(event)}>
                    Edit
                  </button>
                  <button className="events-delete-btn" onClick={() => handleDeleteEvent(event.id)}>
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
    </div>
  );
};

export default Events;