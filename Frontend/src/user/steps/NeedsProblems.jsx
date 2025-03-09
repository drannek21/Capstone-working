import React from "react";
import { useForm } from "react-hook-form";
import "./NeedsProblems.css";
import "./shared.css";

export default function NeedsProblems({ prevStep, nextStep, formData, updateFormData }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formData
  });

  const onSubmit = (data) => {
    updateFormData({ ...formData, ...data });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="needs-form step-form">
      <h2 className="needs-title step-header">
        Step 4: Needs/Problems of Being a Solo Parent
        <span className="subtitle">(Kailangan / problema ng isang solo parent)</span>
      </h2>
      
      <div className="needs-input-container">
        <label className="needs-label step-label">Please describe your needs or problems as a solo parent:</label>
        <textarea
          className={`needs-input step-input ${errors.needsProblems ? 'error' : ''}`}
          placeholder="Enter needs/problems"
          {...register("needsProblems", { required: "This field is required" })}
          rows={4}
        />
        {errors.needsProblems && <p className="needs-error step-error">{errors.needsProblems.message}</p>}
      </div>

      <div className="needs-buttons">
        <button type="button" className="needs-back-btn step-button" onClick={prevStep}>Back</button>
        <button type="submit" className="needs-submit-btn step-button">Next</button>
      </div>
    </form>
  );
}