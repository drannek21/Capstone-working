import React from "react";
import { useForm } from "react-hook-form";
import "./InCaseOfEmergency.css";
import "./shared.css";

export default function InCaseOfEmergency({ prevStep, nextStep, updateFormData, formData }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      emergency_name: formData.emergency_name || "",
      emergency_relationship: formData.emergency_relationship || "",
      emergency_address: formData.emergency_address || "",
      emergency_contact: formData.emergency_contact || ""
    }
  });

  const onSubmitForm = (data) => {
    updateFormData({
      emergency_name: data.emergency_name,
      emergency_relationship: data.emergency_relationship,
      emergency_address: data.emergency_address,
      emergency_contact: data.emergency_contact
    });
    nextStep();
  };

  return (
    <div className="ice-container">
      <form onSubmit={handleSubmit(onSubmitForm)} className="ice-form step-form">
        <h2 className="ice-header step-header">In Case of Emergency</h2>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Name</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_name ? 'error' : ''}`}
            placeholder="Full Name"
            {...register("emergency_name", { required: "This field is required" })}
          />
          {errors.emergency_name && <p className="ice-error-message step-error">{errors.emergency_name.message}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Relationship</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_relationship ? 'error' : ''}`}
            placeholder="Relationship"
            {...register("emergency_relationship", { required: "This field is required" })}
          />
          {errors.emergency_relationship && <p className="ice-error-message step-error">{errors.emergency_relationship.message}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Address</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_address ? 'error' : ''}`}
            placeholder="Complete Address"
            {...register("emergency_address", { required: "This field is required" })}
          />
          {errors.emergency_address && <p className="ice-error-message step-error">{errors.emergency_address.message}</p>}
        </div>

        <div className="ice-form-group">
          <label className="ice-form-label step-label">Contact Number</label>
          <input
            type="text"
            className={`ice-form-input step-input ${errors.emergency_contact ? 'error' : ''}`}
            placeholder="Contact Number"
            {...register("emergency_contact", { required: "This field is required" })}
          />
          {errors.emergency_contact && <p className="ice-error-message step-error">{errors.emergency_contact.message}</p>}
        </div>

        <div className="ice-form-buttons">
          <button type="button" onClick={prevStep} className="ice-back-btn step-button">Back</button>
          <button type="submit" className="ice-next-btn step-button">Next</button>
        </div>
      </form>
    </div>
  );
}
