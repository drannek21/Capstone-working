import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import "./shared.css";

const DocumentUpload = ({ formData, updateFormData, prevStep, handleSubmit }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const documentTypes = {
    psa: "PSA Birth Certificate",
    itr: "Income Tax Return",
    med_cert: "Medical Certificate",
    marriage: "Marriage Certificate",
    cenomar: "CENOMAR",
    death_cert: "Death Certificate"
  };

  const handleFileSelect = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [documentType]: file
    }));

    // Reset progress for this document type
    setUploadProgress(prev => ({
      ...prev,
      [documentType]: 0
    }));
  };

  const uploadToCloudinary = async (file, documentType, code_id) => {
    try {
      console.log('Uploading to Cloudinary:', { file, documentType, code_id });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'soloparent');
      formData.append('folder', `soloparent/users/${code_id}/documents/${documentType}`);

      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dskj7oxr7/upload',
        formData
      );

      if (!response.data.secure_url) {
        throw new Error('Failed to get URL from Cloudinary');
      }

      return response.data.secure_url;
    } catch (error) {
      console.error(`Error uploading ${documentType} to Cloudinary:`, error);
      throw error;
    }
  };

  const insertDocumentToDatabase = async (documentType, fileName, url, code_id) => {
    try {
      console.log(`Inserting ${documentType} document:`, {
        code_id,
        file_name: url,
        uploaded_at: new Date().toISOString(),
        display_name: fileName
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/documents/${documentType}`,
        {
          code_id: code_id,
          file_name: url,
          uploaded_at: new Date().toISOString(),
          display_name: fileName
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to insert document');
      }

      return response.data;
    } catch (error) {
      console.error(`Error inserting ${documentType} document:`, error);
      throw error;
    }
  };

  const handleRegistrationSubmit = async () => {
    console.log('handleRegistrationSubmit clicked');
    console.log('Selected files:', selectedFiles);
    console.log('Form data:', formData);

    if (Object.keys(selectedFiles).length === 0) {
      toast.error("Please select at least one document to upload");
      return;
    }

    setIsUploading(true);

    try {
      // First submit the form to get a code_id
      console.log('Submitting form data first to get code_id');
      if (typeof handleSubmit !== 'function') {
        throw new Error('handleSubmit function is not available');
      }

      const submitResponse = await handleSubmit();
      console.log('Form submission response:', submitResponse);

      if (!submitResponse || !submitResponse.code_id) {
        throw new Error('Failed to get code_id after form submission');
      }

      const code_id = submitResponse.code_id;
      console.log('Got code_id:', code_id);
      const documentUrls = {};
      
      // Now process each document with the real code_id
      for (const [documentType, file] of Object.entries(selectedFiles)) {
        try {
          console.log(`Processing ${documentType} document:`, file.name);
          
          // Upload to Cloudinary with the real code_id
          const url = await uploadToCloudinary(file, documentType, code_id);
          console.log(`Cloudinary upload successful for ${documentType}:`, url);
          
          // Insert into database with the real code_id
          const result = await insertDocumentToDatabase(documentType, file.name, url, code_id);
          console.log(`Database insert successful for ${documentType}:`, result);
          
          documentUrls[documentType] = {
            url: url,
            displayName: file.name
          };
          
          toast.success(`${documentTypes[documentType]} uploaded successfully`);
        } catch (error) {
          console.error(`Error processing ${documentType}:`, error);
          const errorMessage = error.response?.data?.error || error.response?.data?.details?.message || error.message;
          toast.error(`Failed to upload ${documentTypes[documentType]}: ${errorMessage}`);
          throw error;
        }
      }

      // Update form data with document URLs
      const updatedFormData = {
        ...formData,
        documents: documentUrls
      };
      console.log('Updating form data with documents:', updatedFormData);
      updateFormData(updatedFormData);

      toast.success("All documents uploaded successfully!");
    } catch (error) {
      console.error("Error during upload:", error);
      toast.error("Failed to complete registration. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    // Debug log when component mounts or props change
    console.log('DocumentUpload component props:', {
      hasFormData: !!formData,
      hasUpdateFormData: typeof updateFormData === 'function',
      hasPrevStep: typeof prevStep === 'function',
      hasHandleSubmit: typeof handleSubmit === 'function',
      selectedFilesCount: Object.keys(selectedFiles).length,
      isUploading
    });
  }, [formData, updateFormData, prevStep, handleSubmit, selectedFiles, isUploading]);

  return (
    <div className="form-container">
      <h2>Document Upload</h2>
      <p>Please upload the required documents (JPG, PNG, or PDF format, max 5MB each)</p>

      {Object.entries(documentTypes).map(([type, label]) => (
        <div key={type} className="form-group">
          <label>{label}:</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => handleFileSelect(e, type)}
            disabled={isUploading}
          />
          {uploadProgress[type] > 0 && (
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${uploadProgress[type]}%` }}
              >
                {uploadProgress[type]}%
              </div>
            </div>
          )}
          {selectedFiles[type] && (
            <p className="selected-file">
              Selected: {selectedFiles[type].name}
            </p>
          )}
        </div>
      ))}

      <div className="button-group">
        <button 
          type="button" 
          onClick={prevStep}
          disabled={isUploading}
        >
          Previous
        </button>
        <button 
          type="button" 
          onClick={handleRegistrationSubmit}
          disabled={isUploading || Object.keys(selectedFiles).length === 0}
          className={`submit-button ${Object.keys(selectedFiles).length > 0 ? 'active' : ''}`}
        >
          {isUploading ? "Uploading..." : "Submit Registration"}
        </button>
      </div>

      {/* Debug info */}
      <div style={{ display: 'none' }}>
        <p>Selected Files: {Object.keys(selectedFiles).length}</p>
        <p>Is Uploading: {isUploading.toString()}</p>
        <p>Code ID: {formData.code_id}</p>
        <p>Handle Submit exists: {Boolean(handleSubmit).toString()}</p>
        <p>Handle Submit type: {typeof handleSubmit}</p>
      </div>
    </div>
  );
};

export default DocumentUpload;
