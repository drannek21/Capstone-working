import { useForm } from "react-hook-form";
import React, { useEffect } from "react";
import "./FamilyOccupation.css";
import "./shared.css";

export default function FamilyOccupation({ prevStep, nextStep, formData, updateFormData }) {
  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    defaultValues: formData
  });

  const rawNumberOfChildren = watch("Number of children") || 0;
  // Ensure numberOfChildren is always a safe integer between 0 and 100
  const numberOfChildren = Number.isInteger(parseInt(rawNumberOfChildren)) && 
    parseInt(rawNumberOfChildren) >= 0 && parseInt(rawNumberOfChildren) <= 100 
    ? parseInt(rawNumberOfChildren) 
    : 0;

  // Clear children data when number of children changes
  useEffect(() => {
    // Clear existing children data when number changes
    const currentChildren = formData.children || [];
    
    if (currentChildren.length !== numberOfChildren) {
      updateFormData({ 
        ...formData,
        children: Array(numberOfChildren).fill({
          first_name: "",
          middle_name: "",
          last_name: "",
          birthdate: "",
          age: "",
          educational_attainment: ""
        })
      });
    }
  }, [numberOfChildren]);

  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Handle text input to filter out numbers and special characters
  const handleTextInput = (e) => {
    const { name, value } = e.target;
    
    // Allow only letters, spaces, periods, hyphens, and apostrophes
    const filteredValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s.\-']/g, '');
    
    if (filteredValue !== value) {
      // Update the input field with the filtered value
      e.target.value = filteredValue;
      
      // Update the form value
      const fieldNameParts = name.match(/children\[(\d+)\]\.(\w+)/);
      if (fieldNameParts && fieldNameParts.length === 3) {
        const index = fieldNameParts[1];
        const field = fieldNameParts[2];
        setValue(`children[${index}].${field}`, filteredValue);
      }
    }
  };

  const birthdates = numberOfChildren > 0 
    ? Array.from({ length: numberOfChildren }).map((_, index) =>
        watch(`children[${index}].birthdate`)
      )
    : [];

  useEffect(() => {
    birthdates.forEach((birthdate, index) => {
      if (birthdate) {
        const age = calculateAge(birthdate);
        setValue(`children[${index}].age`, age);
      }
    });
  }, [birthdates, setValue]);

  const onSubmit = async (data) => {
    const isValid = await trigger();
    if (!isValid) return;
  
    const childrenData = numberOfChildren > 0
      ? Array.from({ length: numberOfChildren }).map((_, index) => ({
          first_name: data.children?.[index]?.["first_name"] || "",
          middle_name: data.children?.[index]?.["middle_name"] || "",
          last_name: data.children?.[index]?.["last_name"] || "",
          birthdate: data.children?.[index]?.["birthdate"] || "",
          age: data.children?.[index]?.["age"] || "",
          educational_attainment: data.children?.[index]?.["educational_attainment"] || ""
        }))
      : [];
  
    updateFormData({ 
      ...formData,
      "Number of children": numberOfChildren,
      children: childrenData 
    });
    nextStep();
  };
  
  // Validation function for name fields
  const validateName = (value) => {
    if (!value) return "This field is required";
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/.test(value)) {
      return "Name must contain only letters, spaces, and basic punctuation";
    }
    return true;
  };
  
  return (
    <form className="family-form step-form" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="family-header step-header">
        Step 2: Family Occupation and Composition
        <span className="subtitle">(Hanapbuhay at Komposisyon ng Pamilya)</span>
      </h2>

      <div className="family-input-group">
        <label className="form-label step-label">Number of Children</label>
        <input
          className={`form-input step-input ${errors["Number of children"] ? 'error' : ''}`}
          type="number"
          placeholder="Enter number of children"
          min="0"
          max="100"
          {...register("Number of children", {
            required: "This field is required",
            min: { value: 0, message: "Number of children cannot be negative" },
            max: { value: 100, message: "Number of children cannot exceed 100" },
            valueAsNumber: true
          })}
          onBlur={() => trigger("Number of children")}
        />
        {errors["Number of children"] &&
          <span className="error-message step-error">{errors["Number of children"].message}</span>
        }
      </div>

      {Array.from({ length: numberOfChildren }).map((_, index) => (
        <div key={index} className="child-form">
          <h4>Child {index + 1}</h4>

          <div className="child-section">
            <h5>Full Name</h5>
            <div className="name-row step-row">
              <div>
                <input
                  className="form-input step-input"
                  type="text"
                  placeholder="First name"
                  maxLength={20}
                  onInput={handleTextInput}
                  {...register(`children[${index}].first_name`, { 
                    required: "First name is required",
                    validate: validateName,
                    maxLength: { value: 20, message: "First name cannot exceed 20 characters" }
                  })}
                />
                {errors.children?.[index]?.["first_name"] &&
                  <span className="error-message step-error">{errors.children[index]["first_name"].message}</span>
                }
              </div>
              <div>
                <input
                  className="form-input step-input"
                  type="text"
                  placeholder="Middle name"
                  maxLength={20}
                  onInput={handleTextInput}
                  {...register(`children[${index}].middle_name`, { 
                    required: "Middle name is required",
                    validate: validateName,
                    maxLength: { value: 20, message: "Middle name cannot exceed 20 characters" }
                  })}
                />
                {errors.children?.[index]?.["middle_name"] &&
                  <span className="error-message step-error">{errors.children[index]["middle_name"].message}</span>
                }
              </div>
              <div>
                <input
                  className="form-input step-input"
                  type="text"
                  placeholder="Last name"
                  maxLength={20}
                  onInput={handleTextInput}
                  {...register(`children[${index}].last_name`, { 
                    required: "Last name is required",
                    validate: validateName,
                    maxLength: { value: 20, message: "Last name cannot exceed 20 characters" }
                  })}
                />
                {errors.children?.[index]?.["last_name"] &&
                  <span className="error-message step-error">{errors.children[index]["last_name"].message}</span>
                }
              </div>
            </div>
          </div>

          <div className="child-section">
            <div className="birth-info">
              <div>
                <label className="form-label step-label">Birthdate</label>
                <input
                  className="form-input step-input"
                  type="date"
                  {...register(`children[${index}].birthdate`, {
                    required: "Birthdate is required",
                    validate: value => {
                      const age = calculateAge(value);
                      return age <= 21 || "Child must be 21 years old or younger";
                    }
                  })}
                  onChange={(e) => {
                    const birthdate = e.target.value;
                    if (birthdate) {
                      const age = calculateAge(birthdate);
                      setValue(`children[${index}].age`, age);
                    }
                  }}
                />
                {errors.children?.[index]?.birthdate &&
                  <span className="error-message step-error">{errors.children[index].birthdate.message}</span>
                }
              </div>

              <div>
                <label className="form-label step-label">Age (Auto-Calculated)</label>
                <input
                  className="form-input step-input"
                  type="number"
                  placeholder="Age"
                  {...register(`children[${index}].age`)}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="child-section">
            <h5>Educational Background</h5>
            <input
              className="form-input step-input"
              type="text"
              placeholder="Educational Attainment (N/A if none)"
              maxLength={40}
              {...register(`children[${index}].educational_attainment`, {
                required: "Educational Attainment is required",
                maxLength: { value: 40, message: "Educational Attainment cannot exceed 40 characters" }
              })}
            />
            {errors.children?.[index]?.["educational_attainment"] &&
              <span className="error-message step-error">
                {errors.children[index]["educational_attainment"].message}
              </span>
            }
          </div>
        </div>
      ))}

      <div className="form-buttons">
        <button type="button" className="back-btn step-button" onClick={prevStep}>
          Back
        </button>
        <button type="submit" className="next-btn step-button">
          Next
        </button>
      </div>
    </form>
  );
}
