import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import IdentifyingInformation from "./steps/IdentifyingInformation";
import FamilyOccupation from "./steps/FamilyOccupation";
import Classification from "./steps/Classification";
import NeedsProblems from "./steps/NeedsProblems";
import InCaseOfEmergency from "./steps/InCaseOfEmergency";
import DocumentUpload from "./steps/DocumentUpload";
import "./MultiStepForm.css";

export default function MultiStepForm() {
  // Add age calculation function
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const [step, setStep] = useState(1);
  const totalSteps = 6; 
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    first_name: "",
    middle_name: "",
    last_name: "",
    age: "",
    gender: "",
    date_of_birth: "",
    place_of_birth: "",
    barangay: "",
    education: "",
    civil_status: "",
    occupation: "",
    religion: "",
    company: "",
    income: "",
    employment_status: "",
    contact_number: "",
    email: "",
    pantawid_beneficiary: "",
    indigenous: "",
    
    // Step 2: Children
    children: [],

    // Step 3: Classification
    classification: "",

    // Step 4: Needs/Problems
    needs_problems: "",

    // Step 5: Emergency Contact
    emergency_name: "",
    emergency_contact: "",
    emergency_address: "",
    emergency_relationship: "",

    // Step 6: Documents
    documents: {}
  });

  const updateFormData = (newData) => {
    // Add age calculation when date of birth is updated
    if (newData.date_of_birth) {
      const calculatedAge = calculateAge(newData.date_of_birth);
      newData.age = calculatedAge.toString();
    }
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData);
      // First, submit all form data to create the user
      const response = await axios.post("http://localhost:8081/submitAllSteps", {
        formData: {
          ...formData,
          documents: formData.documents || {} // Include documents if they exist
        }
      });

      if (response.data.success) {
        toast.success("Registration completed successfully!");
        // Redirect to success page or login
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to submit form");
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const submissionData = {
        formData: {
          // Step 1: Personal Information
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          age: formData.age,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          place_of_birth: formData.place_of_birth,
          barangay: formData.barangay,
          education: formData.education,
          civil_status: formData.civil_status,
          occupation: formData.occupation,
          religion: formData.religion,
          company: formData.company,
          income: formData.income,
          employment_status: formData.employment_status,
          contact_number: formData.contact_number,
          email: formData.email,
          pantawid_beneficiary: formData.pantawid_beneficiary,
          indigenous: formData.indigenous,

          // Step 2: Children
          children: formData.children.map(child => ({
            first_name: child.first_name,
            middle_name: child.middle_name,
            last_name: child.last_name,
            birthdate: child.birthdate,
            age: child.age,
            educational_attainment: child.educational_attainment
          })),

          // Step 3: Classification
          classification: formData.classification,

          // Step 4: Needs/Problems
          needs_problems: formData.needs_problems,

          // Step 5: Emergency Contact
          emergency_contact: {
            emergency_name: formData.emergency_name,
            emergency_relationship: formData.emergency_relationship,
            emergency_address: formData.emergency_address,
            emergency_contact: formData.emergency_contact
          },

          // Step 6: Documents
          documents: formData.documents
        }
      };

      const response = await fetch("http://localhost:8081/submitAllSteps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const result = await response.json();
      alert(`Form submitted successfully! Your Code ID is: ${result.codeId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <IdentifyingInformation
            nextStep={nextStep}
            updateFormData={updateFormData}
            formData={formData}
          />
        );
      case 2:
        return (
          <FamilyOccupation
            prevStep={prevStep}
            nextStep={nextStep}
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <Classification
            prevStep={prevStep}
            nextStep={nextStep}
            updateFormData={updateFormData}
            formData={formData}
          />
        );
      case 4:
        return (
          <NeedsProblems
            prevStep={prevStep}
            nextStep={nextStep}
            updateFormData={updateFormData}
            formData={formData}
          />
        );
      case 5:
        return (
          <InCaseOfEmergency
            prevStep={prevStep}
            updateFormData={updateFormData}
            formData={formData}
            nextStep={nextStep}
          />
        );
      case 6:
        return (
          <DocumentUpload
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="multi-step-form-wrapper">
      <div className="multi-step-form-body">
        <div>
          {renderStep()}
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
      </div>
    </div>
  );
}
