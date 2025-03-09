
import React from "react";
import { useForm } from "react-hook-form";
import "./Classification.css";
import "./shared.css";

export default function Classification({ prevStep, nextStep, formData, updateFormData }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formData
  });

  const onSubmit = (data) => {
    updateFormData(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="classification-form step-form">
      <h2 className="classification-header step-header">
        Classification/Circumstances of Being a Solo Parent
        <span className="subtitle">(Dahilan bakit Naging Solo Parent)</span>
      </h2>
      
      <div className="classification-input-container">
        <label className="classification-label step-label">Please describe your circumstances:</label>
        <textarea 
          {...register("Classification", { required: "This field is required" })} 
          className={`classification-input step-input ${errors.Classification ? 'error' : ''}`}
          placeholder="Enter your circumstances"
          rows={4}
        />
        {errors.Classification && 
          <p className="classification-error step-error">{errors.Classification.message}</p>
        }
      </div>

      <div className="classification-buttons">
        <button type="button" className="classification-back-btn step-button" onClick={prevStep}>Back</button>
        <button type="submit" className="classification-next-btn step-button">Next</button>
      </div>
    </form>
  );
}
