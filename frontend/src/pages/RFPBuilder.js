import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, documentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ListBulletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RFPBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatedSections, setGeneratedSections] = useState([]);
  const [formData, setFormData] = useState({
    project_type: '',
    industry: '',
    budget_range: '',
    timeline: '',
    requirements: '',
    company_info: '',
    specific_deliverables: [''],
    evaluation_criteria: [''],
    additional_context: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const generateRFP = async () => {
    setLoading(true);
    try {
      // Filter out empty deliverables and criteria
      const cleanedData = {
        ...formData,
        specific_deliverables: formData.specific_deliverables.filter(item => item.trim() !== ''),
        evaluation_criteria: formData.evaluation_criteria.filter(item => item.trim() !== '')
      };

      const response = await aiAPI.generateRFP(cleanedData);
      setGeneratedSections(response.data.sections);
      toast.success('RFP generated successfully!');
    } catch (error) {
      console.error('Error generating RFP:', error);
      toast.error('Failed to generate RFP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsDocument = async () => {
    if (!generatedSections.length) {
      toast.error('Please generate RFP content first');
      return;
    }

    try {
      const documentData = {
        title: `RFP - ${formData.project_type}`,
        type: 'rfp',
        organization: user.organization,
        sections: generatedSections.map(section => ({
          ...section,
          multimedia_elements: [],
          interactive_elements: []
        })),
        collaborators: [],
        tags: ['rfp', 'ai-generated', formData.industry],
        metadata: {
          generated_by: 'ai',
          project_type: formData.project_type,
          industry: formData.industry,
          budget_range: formData.budget_range
        }
      };

      const response = await documentsAPI.create(documentData);
      toast.success('RFP saved as document!');
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document. Please try again.');
    }
  };

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const ArrayInput = ({ items, field, placeholder, label }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="text"
            value={item}
            onChange={(e) => handleArrayInputChange(index, e.target.value, field)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeArrayItem(index, field)}
              className="px-3 py-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayItem(field)}
        className="text-sm text-indigo-600 hover:text-indigo-800"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI RFP Builder</h1>
              <p className="text-sm text-gray-600">
                Generate professional Request for Proposals using artificial intelligence
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <FormSection title="Project Details" icon={DocumentTextIcon}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Type</label>
                <input
                  type="text"
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Website Development, Marketing Campaign"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Budget & Timeline" icon={CurrencyDollarIcon}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Budget Range</label>
                <select
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select Budget Range</option>
                  <option value="under-10k">Under $10,000</option>
                  <option value="10k-50k">$10,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-500k">$100,000 - $500,000</option>
                  <option value="over-500k">Over $500,000</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timeline</label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="e.g., 3 months, Q2 2024"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Company Information" icon={BuildingOfficeIcon}>
            <textarea
              name="company_info"
              value={formData.company_info}
              onChange={handleInputChange}
              rows={4}
              placeholder="Brief description of your company, industry, and relevant background..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </FormSection>

          <FormSection title="Requirements" icon={ListBulletIcon}>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              rows={6}
              placeholder="Detailed project requirements, scope, and specifications..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </FormSection>

          <FormSection title="Deliverables & Criteria" icon={CheckCircleIcon}>
            <div className="space-y-4">
              <ArrayInput
                items={formData.specific_deliverables}
                field="specific_deliverables"
                placeholder="Enter a deliverable"
                label="Specific Deliverables"
              />
              <ArrayInput
                items={formData.evaluation_criteria}
                field="evaluation_criteria"
                placeholder="Enter evaluation criteria"
                label="Evaluation Criteria"
              />
            </div>
          </FormSection>

          <FormSection title="Additional Context" icon={ExclamationTriangleIcon}>
            <textarea
              name="additional_context"
              value={formData.additional_context}
              onChange={handleInputChange}
              rows={3}
              placeholder="Any additional context, constraints, or special requirements..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </FormSection>

          <button
            onClick={generateRFP}
            disabled={loading || !formData.project_type || !formData.industry}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating RFP...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                Generate RFP with AI
              </>
            )}
          </button>
        </div>

        {/* Generated Content Section */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generated RFP Content</h3>
            
            {generatedSections.length > 0 ? (
              <div className="space-y-6">
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {generatedSections.map((section, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-2">{section.title}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={saveAsDocument}
                    className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Save as Document
                  </button>
                  <button
                    onClick={() => setGeneratedSections([])}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <SparklesIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No content generated yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill out the form and click "Generate RFP with AI" to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPBuilder;