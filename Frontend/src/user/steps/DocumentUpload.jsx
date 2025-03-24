import React, { useState } from "react";
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

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "soloparent");
    formData.append("folder", "soloparent/documents");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dskj7oxr7/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        }
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (Object.keys(selectedFiles).length === 0) {
      toast.error("Please select at least one document to upload");
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = [];
      const documentUrls = {};

      // First, upload all files to Cloudinary
      for (const [documentType, file] of Object.entries(selectedFiles)) {
        const uploadPromise = uploadToCloudinary(file)
          .then(url => {
            documentUrls[documentType] = {
              url: url,
              displayName: file.name
            };
          });
        uploadPromises.push(uploadPromise);
      }

      await Promise.all(uploadPromises);

      // Update form data with document URLs
      const updatedFormData = {
        ...formData,
        documents: documentUrls
      };
      updateFormData(updatedFormData);

      // Call the final submit handler
      await handleSubmit();
    } catch (error) {
      console.error("Error during upload:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

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
          onClick={handleUpload}
          disabled={isUploading || Object.keys(selectedFiles).length === 0}
        >
          {isUploading ? "Uploading..." : "Submit Registration"}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
