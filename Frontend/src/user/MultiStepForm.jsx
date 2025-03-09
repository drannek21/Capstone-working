import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import IdentifyingInformation from "./steps/IdentifyingInformation";
import FamilyOccupation from "./steps/FamilyOccupation";
import Classification from "./steps/Classification";
import NeedsProblems from "./steps/NeedsProblems";
import InCaseOfEmergency from "./steps/InCaseOfEmergency";
import "./MultiStepForm.css";

export default function MultiStepForm() {
  const { state } = useLocation();
  const userId = state?.userId || localStorage.getItem("UserId"); // Get userId from state or localStorage

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    gender: "",
    dateOfBirth: "",
    placeOfBirth: "",
    address: "",
    education: "",
    civilStatus: "",
    occupation: "",
    religion: "",
    company: "",
    income: "",
    employmentStatus: "",
    contactNumber: "",
    email: "",
    pantawidBeneficiary: "",
    indigenous: "",
  });

  const generateCodeId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomString = Math.random().toString(36).substr(2, 6).toUpperCase(); // 6 random alphanumeric characters
    return `${year}-${month}-${randomString}`;
  };

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const saveData = async () => {
    if (!userId) {
      console.error("No user logged in.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8081/userDetailsStep1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, userId }), // Send userId with form data
      });
      const result = await response.json();
      if (response.status === 201) {
        console.log("Data saved successfully:", result);
      } else {
        console.error("Failed to save data:", result);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const nextStep = () => {
    saveData();
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div>
      {step === 1 && (
        <IdentifyingInformation
          nextStep={nextStep}
          updateFormData={updateFormData}
          formData={formData}
        />
      )}
      {step === 2 && (
        <FamilyOccupation
          nextStep={nextStep}
          prevStep={prevStep}
          updateFormData={updateFormData}
          formData={formData}
        />
      )}
      {step === 3 && (
        <Classification
          prevStep={prevStep}
          nextStep={nextStep}
          updateFormData={updateFormData}
          formData={formData}
        />
      )}
      {step === 4 && (
        <NeedsProblems
          prevStep={prevStep}
          nextStep={nextStep}
          updateFormData={updateFormData}
          formData={formData}
        />
      )}
      {step === 5 && (
        <InCaseOfEmergency
          prevStep={prevStep}
          updateFormData={updateFormData}
          formData={formData}
        />
      )}
      <div className="pagination">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`pagination-dot ${step === index + 1 ? "active" : ""}`}
          ></div>
        ))}
        <p>Step {step} of {totalSteps}</p>
      </div>
    </div>
  );
}
