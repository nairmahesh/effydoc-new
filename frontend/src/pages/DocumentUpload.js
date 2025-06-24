import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DocumentUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [extractText, setExtractText] = useState(true); // New option for text extraction

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, DOCX, or TXT files only');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadDocument = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('title', title);
      formData.append('extract_text', extractText.toString()); // Add extract text option

      const response = await documentsAPI.upload(formData);
      
      toast.success('Document uploaded successfully!');
      // With the updated Axios interceptor, response is now the data object directly
      navigate(`/documents/${response.document.id}/preview`); // Navigate to preview instead of edit
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setTitle('');
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    if (fileType === 'text/plain') return '📃';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <CloudArrowUpIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
              <p className="text-sm text-gray-600">
                Upload PDF, DOCX, or TXT files and convert them to editable documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your document here
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse your files
              </p>
              
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
                id="fileInput"
              />
              
              <label
                htmlFor="fileInput"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Choose File
              </label>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>Supported formats: PDF, DOCX, TXT</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Preview */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(uploadedFile.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadedFile.size)} • {uploadedFile.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* PDF/Document Processing Options */}
              {uploadedFile && uploadedFile.type === 'application/pdf' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">PDF Processing Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pdfProcessing"
                        checked={!extractText}
                        onChange={() => setExtractText(false)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <strong>Preserve Original PDF</strong> - View as PDF with original layout, images, and formatting (recommended for forms, documents with complex layouts)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pdfProcessing"
                        checked={extractText}
                        onChange={() => setExtractText(true)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <strong>Extract Text for Editing</strong> - Convert to editable text (images will be lost, best for text-heavy documents)
                      </span>
                    </label>
                  </div>
                </div>
              )}
              
              {/* For other file types, show a simple toggle */}
              {uploadedFile && uploadedFile.type !== 'application/pdf' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={extractText}
                      onChange={(e) => setExtractText(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Extract and optimize content for editing
                    </span>
                  </label>
                </div>
              )}

              {/* Upload Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={removeFile}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Choose Different File
                </button>
                
                <button
                  onClick={uploadDocument}
                  disabled={uploading || !title.trim()}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Upload & Process
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Info */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What happens after upload?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Text Extraction</h4>
              <p className="text-sm text-gray-500">
                We extract and structure your document content into editable sections
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Interactive Elements</h4>
              <p className="text-sm text-gray-500">
                Add e-signature fields, buttons, videos, and audio to any section
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <ArrowPathIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Google Docs-Style Editing</h4>
              <p className="text-sm text-gray-500">
                Edit content like Google Docs with real-time collaboration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;