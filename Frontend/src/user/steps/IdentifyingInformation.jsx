import React, { useState } from "react";
import "./IdentifyingInformation.css";
import barangays from '../../data/santaMariaBarangays.json';

export default function IdentifyingInformation({ nextStep, updateFormData, formData }) {
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dateOfBirth') {
      const age = calculateAge(value);
      updateFormData({ dateOfBirth: value, age });
    } else if (name === 'contactNumber') {
      let formattedValue = value.replace(/\D/g, '');
      if (!formattedValue.startsWith('09') && formattedValue.length > 0) {
        formattedValue = '09' + formattedValue.substring(formattedValue.length > 2 ? 2 : 0);
      }
      if (formattedValue.length <= 11) {
        updateFormData({ [name]: formattedValue });
      }
    } else if (name === 'income') {
      // Ensure income is saved as the selected text value
      updateFormData({ [name]: value || '' });
    } else {
      updateFormData({ [name]: value });
    }
  };

  // Update the validation for contact number
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = "First Name is required.";
    }

    if (!formData.middleName) {
      newErrors.middleName = "Middle Name is required.";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last Name is required.";
    }

    if (!formData.age || formData.age <= 0 || formData.age > 999) {
      newErrors.age = "Age must be a positive number between 1 and 999.";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required.";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required.";
    }

    if (!formData.placeOfBirth) {
      newErrors.placeOfBirth = "Place of Birth is required.";
    }

    if (!formData.barangay) {
      newErrors.barangay = "Barangay is required.";
    }

    if (!formData.education) {
      newErrors.education = "Educational Attainment is required.";
    }

    if (!formData.civilStatus) {
      newErrors.civilStatus = "Civil Status is required.";
    }

    if (!formData.occupation) {
      newErrors.occupation = "Occupation is required.";
    }

    if (!formData.religion) {
      newErrors.religion = "Religion is required.";
    }

    if (!formData.company) {
      newErrors.company = "Company/Agency is required.";
    }

    // Add this single income validation
    if (!formData.income) {
      newErrors.income = "Monthly Income is required.";
    }

    // Fix the barangay validation
    if (!formData.barangay) {  // Changed from address to barangay
      newErrors.barangay = "Barangay is required.";  // Changed from address to barangay
    }

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "Employment Status is required.";
    }

    if (!formData.contactNumber || !formData.contactNumber.startsWith('09') || formData.contactNumber.length !== 11) {
      newErrors.contactNumber = "Contact Number must start with 09 and be exactly 11 digits.";
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid Email Address is required.";
    }

    if (!formData.pantawidBeneficiary) {
      newErrors.pantawidBeneficiary = "Pantawid Beneficiary status is required.";
    }

    if (!formData.indigenous) {
      newErrors.indigenous = "Indigenous status is required.";
    }

    return newErrors;
  };

  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Run validation
    const formErrors = validateForm();
    setErrors(formErrors);
  
    if (Object.keys(formErrors).length === 0) {
      // Show success message briefly
      setSuccessMessage("Form validated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        nextStep(); // Move to the next step
      }, 1000); 
    } else {
      // Auto-clear errors after a few seconds
      setTimeout(() => {
        setErrors({});
      }, 3000); 
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="identifying-form">
      <h2 className="identifying-header">Step 1: Identifying Information</h2>
      
      {successMessage && <div className="success-message">{successMessage}</div>} {/* Display success message */}

      {/* Names - Side by Side */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your first name"
            maxLength={20}
          />
          {errors.firstName && <span className="error">{errors.firstName}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your middle name"
            maxLength={20}
          />
          {errors.middleName && <span className="error">{errors.middleName}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your last name"
            maxLength={20}
          />
          {errors.lastName && <span className="error">{errors.lastName}</span>}
        </div>
      </div>

      {/* Date of Birth & Age */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Select your birth date"
          />
          {errors.dateOfBirth && <span className="error">{errors.dateOfBirth}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age || ''}
            readOnly
            className="identifying-input"
            placeholder="Auto-calculated from birth date"
          />
          {errors.age && <span className="error">{errors.age}</span>}
        </div>
      </div>

      {/* Gender & Place of Birth */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Gender</label>
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="LGBTQ+">LGBTQ+</option>
          </select>
          {errors.gender && <span className="error">{errors.gender}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Place of Birth</label>
          <input
            type="text"
            name="placeOfBirth"
            value={formData.placeOfBirth || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your place of birth"
            maxLength={50}
          />
          {errors.placeOfBirth && <span className="error">{errors.placeOfBirth}</span>}
        </div>
      </div>

      {/* Address */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Municipality</label>
          <input
            type="text"
            value="Santa Maria"
            disabled
            className="identifying-input"
          />
        </div>
        <div className="form-group">
          <label className="identifying-label">Barangay</label>
          <select
            name="barangay"  // Changed from 'address' to 'barangay'
            value={formData.barangay || ''}  // Changed from address to barangay
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Select Barangay</option>
            {barangays.Barangays.map((barangay, index) => (
              <option key={index} value={barangay}>
                {barangay}
              </option>
            ))}
          </select>
          {errors.barangay && <span className="error">{errors.barangay}</span>}
        </div>
      </div>

      {/* Educational Attainment, Civil Status, and Occupation in one row */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Educational Attainment</label>
          <input
            type="text"
            name="education"
            value={formData.education || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your educational attainment"
            maxLength={20}
          />
          {errors.education && <span className="error">{errors.education}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Civil Status</label>
          <select
            name="civilStatus"
            value={formData.civilStatus || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          {errors.civilStatus && <span className="error">{errors.civilStatus}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Occupation</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your occupation"
            maxLength={20}
          />
          {errors.occupation && <span className="error">{errors.occupation}</span>}
        </div>
      </div>

      {/* Religion, Company, and Monthly Income in one row */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Religion</label>
          <input
            type="text"
            name="religion"
            value={formData.religion || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your religion"
            maxLength={20}
          />
          {errors.religion && <span className="error">{errors.religion}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Company/Agency</label>
          <input
            type="text"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="Enter your company/agency"
            maxLength={40}
          />
          {errors.company && <span className="error">{errors.company}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Monthly Income</label>
          <select
            name="income"
            value={formData.income || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Select Income Range</option>
            <option value="Below ₱10,000">Below ₱10,000</option>
            <option value="₱11,000-₱20,000">₱11,000-₱20,000</option>
            <option value="₱21,000-₱43,000">₱21,000-₱43,000</option>
            <option value="₱44,000 and above">₱44,000 and above</option>
          </select>
          {errors.income && <span className="error">{errors.income}</span>}
        </div>
      </div>

      {/* Employment Status */}
      <div className="form-group">
        <label className="identifying-label">Employment Status</label>
        <select
          name="employmentStatus"
          value={formData.employmentStatus || ''}
          onChange={handleChange}
          className="identifying-input"
        >
          <option value="" disabled>Please choose</option>
          <option value="Employed">Employed</option>
          <option value="Self-employed">Self-employed</option>
          <option value="Not employed">Not employed</option>
        </select>
        {errors.employmentStatus && <span className="error">{errors.employmentStatus}</span>}
      </div>

      {/* Contact Number & Email */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Contact Number</label>
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="09XXXXXXXXX"
          />
          {errors.contactNumber && <span className="error">{errors.contactNumber}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="identifying-input"
            placeholder="example@email.com"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
      </div>

      {/* Pantawid Beneficiary & Indigenous */}
      <div className="identifying-row">
        <div className="form-group">
          <label className="identifying-label">Pantawid Beneficiary</label>
          <select
            name="pantawidBeneficiary"
            value={formData.pantawidBeneficiary || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {errors.pantawidBeneficiary && <span className="error">{errors.pantawidBeneficiary}</span>}
        </div>
        <div className="form-group">
          <label className="identifying-label">Indigenous</label>
          <select
            name="indigenous"
            value={formData.indigenous || ''}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {errors.indigenous && <span className="error">{errors.indigenous}</span>}
        </div>
      </div>

      <button type="submit" className="identifying-next-btn">Next</button>
    </form>
  );
}

