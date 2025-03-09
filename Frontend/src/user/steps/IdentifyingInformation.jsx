import React, { useState } from "react";
import "./IdentifyingInformation.css";

export default function IdentifyingInformation({ nextStep, updateFormData, formData }) {
  const [errors, setErrors] = useState({});

  // Update formData directly when inputs change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent numbers in name fields (First Name, Middle Name, Last Name)
    if (name === "firstName" || name === "middleName" || name === "lastName") {
      if (/[^a-zA-Z ]/.test(value)) {
        return; // If the value contains numbers or special characters, do not update
      }
    }

    // Prevent special characters or numbers in Religion field
    if (name === "religion") {
      if (/[^a-zA-Z ]/.test(value)) {
        return; // If the value contains special characters or numbers, do not update
      }
    }

    // Handle phone number input with prefix "09" and 11 digits
    if (name === "contactNumber") {
      let formattedValue = value.replace(/\D/g, ""); // Remove non-digit characters
      if (!formattedValue.startsWith("09")) {
        formattedValue = "09" + formattedValue.slice(2); // Ensure the number starts with "09"
      }
      if (formattedValue.length <= 11) {
        updateFormData({ [name]: formattedValue });
      }
      return;
    }

    // Format Monthly Income with Peso sign and restrict to max 20,000
    if (name === "income") {
      const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters
      let incomeValue = numericValue !== "" ? parseInt(numericValue, 10) : "";

      // Ensure the income doesn't exceed 20,000
      if (incomeValue > 20000) {
        incomeValue = 20000;
      }

      updateFormData({ [name]: incomeValue ? incomeValue.toString() : '' });
      return;
    }
// Format Monthly Income with Peso sign
    if (name === "income") {
      const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters
      if (numericValue !== "") {
        updateFormData({ [name]: numericValue });
      } else {
        updateFormData({ [name]: '' });
      }
      return;
    }
    

    // Limit Age to 3 digits (1 to 999)
    if (name === "age") {
      if (value && (value > 999 || value <= 0 || isNaN(value))) {
        return; // Allow only numbers between 1 and 999
      }
    }

    // Update formData for other fields
    updateFormData({ [name]: value });
  };

  // Simple validation function
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

    if (!formData.address) {
      newErrors.address = "Address is required.";
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

    if (!formData.income || formData.income <= 0) {
      newErrors.income = "Monthly Income must be a positive number.";
    }

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "Employment Status is required.";
    }

    if (!formData.contactNumber || formData.contactNumber.length < 10) {
      newErrors.contactNumber = "Contact Number must be at least 10 digits.";
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
      setTimeout(() => {
        nextStep();
      }, 3000); 
    } else {
      setTimeout(() => {
        setErrors({});
      }, 3000); 
    }
  };

  // Format Monthly Income to include Peso sign
  const formatIncome = (income) => {
    return income ? `₱${income}` : '';
  };

  return (
    <form onSubmit={handleSubmit} className="identifying-form">
      <h2 className="identifying-header">Step 1: Identifying Information</h2>

      {/* Names - Side by Side */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.firstName && <span className="error">{errors.firstName}</span>}
        </div>
        <div>
          <label className="identifying-label">Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.middleName && <span className="error">{errors.middleName}</span>}
        </div>
        <div>
          <label className="identifying-label">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.lastName && <span className="error">{errors.lastName}</span>}
        </div>
      </div>

      {/* Age & Gender */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.age && <span className="error">{errors.age}</span>}
        </div>
        <div>
          <label className="identifying-label">Gender</label>
          <select
            name="gender"
            value={formData.gender}
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
      </div>

      {/* Birthdate & Birthplace */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.dateOfBirth && <span className="error">{errors.dateOfBirth}</span>}
        </div>
        <div>
          <label className="identifying-label">Place of Birth</label>
          <input
            type="text"
            name="placeOfBirth"
            value={formData.placeOfBirth}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.placeOfBirth && <span className="error">{errors.placeOfBirth}</span>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="identifying-label">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="identifying-input"
        />
        {errors.address && <span className="error">{errors.address}</span>}
      </div>

      {/* Educational Attainment & Civil Status */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">Educational Attainment</label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.education && <span className="error">{errors.education}</span>}
        </div>
        <div>
          <label className="identifying-label">Civil Status</label>
          <select
            name="civilStatus"
            value={formData.civilStatus}
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
      </div>

      {/* Occupation & Religion */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">Occupation</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.occupation && <span className="error">{errors.occupation}</span>}
        </div>
        <div>
          <label className="identifying-label">Religion</label>
          <input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.religion && <span className="error">{errors.religion}</span>}
        </div>
      </div>

      {/* Company & Monthly Income */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">Company/Agency</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.company && <span className="error">{errors.company}</span>}
        </div>
        <div>
          <label className="identifying-label">Monthly Income</label>
          <input
            type="text"
            name="income"
            placeholder="₱"
            value={formData.income}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.income && <span className="error">{errors.income}</span>}
        </div>
      </div>

      {/* Employment Status */}
      <div>
        <label className="identifying-label">Employment Status</label>
        <select
          name="employmentStatus"
          value={formData.employmentStatus}
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
        <div>
          <label className="identifying-label">Contact Number</label>
          <input
            type="number"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.contactNumber && <span className="error">{errors.contactNumber}</span>}
        </div>
        <div>
          <label className="identifying-label">Email Address</label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="identifying-input"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
      </div>

      {/* Pantawid Beneficiary & Indigenous */}
      <div className="identifying-row">
        <div>
          <label className="identifying-label">Pantawid Beneficiary</label>
          <select
            name="pantawidBeneficiary"
            value={formData.pantawidBeneficiary}
            onChange={handleChange}
            className="identifying-input"
          >
            <option value="" disabled>Please choose</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {errors.pantawidBeneficiary && <span className="error">{errors.pantawidBeneficiary}</span>}
        </div>
        <div>
          <label className="identifying-label">Indigenous</label>
          <select
            name="indigenous"
            value={formData.indigenous}
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




