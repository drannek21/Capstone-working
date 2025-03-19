import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./InCaseOfEmergency.css";
import "./shared.css";

export default function InCaseOfEmergency({ prevStep, updateFormData, formData, onSubmit }) {
  const navigate = useNavigate(); // Initialize navigate function
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      emergencyName: formData.emergencyContact?.emergencyName || "",
      emergencyRelationship: formData.emergencyContact?.emergencyRelationship || "",
      emergencyAddress: formData.emergencyContact?.emergencyAddress || "",
      emergencyContact: formData.emergencyContact?.emergencyContact || ""
    }
  });

  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFormSubmit = (data) => {
    const emergencyContact = {
      emergencyName: data.emergencyName,
      emergencyRelationship: data.emergencyRelationship,
      emergencyAddress: data.emergencyAddress,
      emergencyContact: data.emergencyContact
    };
    updateFormData({ ...formData, emergencyContact });
    setIsConfirming(true);
  };

  const confirmSubmission = async () => {
    setIsConfirming(false);
    if (onSubmit) {
      try {
        await onSubmit();
        setIsSubmitted(true);
      } catch (error) {
        alert("Failed to submit form. Please try again.");
      }
    }
  };

  // Automatically redirect after submission
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        navigate("/userui"); // Redirect to profile page after 3 seconds
      }, 3000);

      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [isSubmitted, navigate]);

  return (
    <div className="ice-container">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="ice-form step-form">
        <h2 className="ice-header step-header">In Case of Emergency</h2>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Name</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergencyName ? 'error' : ''}`}
            placeholder="Full Name"
            {...register("emergencyName", { required: "This field is required" })}
          />
          {errors.emergencyName && <p className="ice-error-message step-error">{errors.emergencyName.message}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Relationship</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergencyRelationship ? 'error' : ''}`}
            placeholder="Relationship"
            {...register("emergencyRelationship", { required: "This field is required" })}
          />
          {errors.emergencyRelationship && <p className="ice-error-message step-error">{errors.emergencyRelationship.message}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Address</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergencyAddress ? 'error' : ''}`}
            placeholder="Address"
            {...register("emergencyAddress", { required: "This field is required" })}
          />
          {errors.emergencyAddress && <p className="ice-error-message step-error">{errors.emergencyAddress.message}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Contact Number</label>
          <input
            type="tel"
            className={`ice-form-input step-input ${errors.emergencyContact ? 'error' : ''}`}
            placeholder="Contact Number"
            {...register("emergencyContact", {
              required: "This field is required",
              pattern: { value: /^[0-9]+$/, message: "Only numbers are allowed" }
            })}
          />
          {errors.emergencyContact && <p className="ice-error-message step-error">{errors.emergencyContact.message}</p>}
        </div>

        <div className="ice-form-buttons">
          <button type="button" className="ice-back-btn step-button" onClick={prevStep}>Back</button>
          <button type="submit" className="ice-next-btn step-button">Submit</button>
        </div>
      </form>

      {isConfirming && (
        <div className={`ice-popup-overlay ${isConfirming ? "active" : ""}`}>
          <div className="ice-popup-content">
            <h3 className="ice-popup-header">Are you sure you want to submit all form data?</h3>
            <p>This will save all information from all steps.</p>
            <div className="ice-popup-buttons">
              <button className="ice-confirm-btn step-button" onClick={confirmSubmission}>Yes, Submit All</button>
              <button className="ice-cancel-btn step-button" onClick={() => setIsConfirming(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className={`ice-popup-overlay ${isSubmitted ? "active" : ""}`}>
          <div className="ice-popup-content ice-success-popup">
            <div className="ice-checkmark">✔</div>
            <h3 className="ice-popup-header">All Forms Submitted Successfully!</h3>
            <p>Redirecting to your profile in 3 seconds...</p>
          </div>
        </div>
      )}
    </div>
  );
}

