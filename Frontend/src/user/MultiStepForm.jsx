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

  const handleFinalSubmit = async () => {
    try {
      console.log('Starting final form submission');
      
      // Submit all steps data to create user entry
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents/submitAllSteps`, {
        step1: {
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
          indigenous: formData.indigenous
        },
        step2: {
          children: formData.children || []
        },
        step3: {
          classification: formData.classification
        },
        step4: {
          needs_problems: formData.needs_problems
        },
        step5: {
          emergency_name: formData.emergency_name,
          emergency_relationship: formData.emergency_relationship,
          emergency_address: formData.emergency_address,
          emergency_contact: formData.emergency_contact
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create user");
      }

      const code_id = response.data.code_id;
      console.log('All steps submitted successfully with code_id:', code_id);

      // Update form data with the new code_id
      const updatedFormData = {
        ...formData,
        code_id: code_id
      };
      updateFormData(updatedFormData);

      return {
        success: true,
        code_id: code_id
      };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || "Registration failed. Please try again.");
      throw error;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <IdentifyingInformation
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <FamilyOccupation
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <Classification
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <NeedsProblems
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <InCaseOfEmergency
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <DocumentUpload
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSubmit={handleFinalSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="multistep-form-container">
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
      </div>
      <div className="step-indicator">
        Step {step} of {totalSteps}
      </div>
      {renderStep()}
    </div>
  );
}
