import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import SimpleRichTextEditor from '../components/Common/SimpleRichTextEditor';
import { documentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  PlayIcon,
  PlusIcon,
  PencilIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  CursorArrowRippleIcon,
  FingerPrintIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  CheckIcon,
  SparklesIcon,
  ArrowLeftIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [elementType, setElementType] = useState(null);
  const [useSimpleEditor, setUseSimpleEditor] = useState(false); // Switch between editors

  // Interactive element forms
  const [multimediaForm, setMultimediaForm] = useState({
    type: 'video',
    url: '',
    title: '',
    description: ''
  });

  const [interactiveForm, setInteractiveForm] = useState({
    type: 'button',
    label: '',
    action: '',
    required: false
  });

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await documentsAPI.get(documentId);
      setDocument(response.data);
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!document) return;
    
    setSaving(true);
    try {
      await documentsAPI.update(documentId, {
        title: document.title,
        sections: document.sections,
        status: document.status
      });
      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const updateSectionContent = async (sectionId, content) => {
    try {
      const updatedSections = document.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      );
      
      setDocument({ ...document, sections: updatedSections });
      
      // Auto-save after 2 seconds of no changes
      setTimeout(async () => {
        await documentsAPI.updateSection(documentId, sectionId, { content });
      }, 2000);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const addMultimediaElement = async () => {
    if (!activeSection || !multimediaForm.url) {
      toast.error('Please provide a valid URL');
      return;
    }

    try {
      await documentsAPI.addMultimedia(documentId, activeSection, multimediaForm);
      
      // Update local state
      const updatedSections = document.sections.map(section => {
        if (section.id === activeSection) {
          return {
            ...section,
            multimedia_elements: [
              ...section.multimedia_elements,
              { ...multimediaForm, id: Date.now().toString() }
            ]
          };
        }
        return section;
      });
      
      setDocument({ ...document, sections: updatedSections });
      setShowElementPanel(false);
      setMultimediaForm({ type: 'video', url: '', title: '', description: '' });
      toast.success('Multimedia element added successfully!');
    } catch (error) {
      console.error('Error adding multimedia:', error);
      toast.error('Failed to add multimedia element');
    }
  };

  const addInteractiveElement = async () => {
    if (!activeSection || !interactiveForm.label) {
      toast.error('Please provide a label');
      return;
    }

    try {
      await documentsAPI.addInteractive(documentId, activeSection, interactiveForm);
      
      // Update local state
      const updatedSections = document.sections.map(section => {
        if (section.id === activeSection) {
          return {
            ...section,
            interactive_elements: [
              ...section.interactive_elements,
              { ...interactiveForm, id: Date.now().toString() }
            ]
          };
        }
        return section;
      });
      
      setDocument({ ...document, sections: updatedSections });
      setShowElementPanel(false);
      setInteractiveForm({ type: 'button', label: '', action: '', required: false });
      toast.success('Interactive element added successfully!');
    } catch (error) {
      console.error('Error adding interactive element:', error);
      toast.error('Failed to add interactive element');
    }
  };

  const ElementPanel = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add {elementType === 'multimedia' ? 'Multimedia' : 'Interactive'} Element
            </h3>
            <button
              onClick={() => setShowElementPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {elementType === 'multimedia' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={multimediaForm.type}
                  onChange={(e) => setMultimediaForm({...multimediaForm, type: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  value={multimediaForm.url}
                  onChange={(e) => setMultimediaForm({...multimediaForm, url: e.target.value})}
                  placeholder="https://example.com/video.mp4"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={multimediaForm.title}
                  onChange={(e) => setMultimediaForm({...multimediaForm, title: e.target.value})}
                  placeholder="Media title"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowElementPanel(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addMultimediaElement}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Element
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={interactiveForm.type}
                  onChange={(e) => setInteractiveForm({...interactiveForm, type: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="button">Button</option>
                  <option value="signature_field">E-signature Field</option>
                  <option value="input_field">Input Field</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Label</label>
                <input
                  type="text"
                  value={interactiveForm.label}
                  onChange={(e) => setInteractiveForm({...interactiveForm, label: e.target.value})}
                  placeholder="Element label"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {interactiveForm.type === 'button' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action URL</label>
                  <input
                    type="url"
                    value={interactiveForm.action}
                    onChange={(e) => setInteractiveForm({...interactiveForm, action: e.target.value})}
                    placeholder="https://example.com/action"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  id="required"
                  type="checkbox"
                  checked={interactiveForm.required}
                  onChange={(e) => setInteractiveForm({...interactiveForm, required: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                  Required field
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowElementPanel(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addInteractiveElement}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Element
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Document not found</h3>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/documents')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Documents
              </button>
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <input
                    type="text"
                    value={document.title}
                    onChange={(e) => setDocument({...document, title: e.target.value})}
                    className="text-2xl font-bold text-gray-900 border-none outline-none bg-transparent hover:bg-gray-50 px-2 py-1 rounded"
                    placeholder="Document title"
                  />
                  <p className="text-sm text-gray-600">
                    ✨ Rich Text Editor • Last updated: {new Date(document.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {saving && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                  Saving...
                </div>
              )}
              
              <button
                onClick={() => navigate(`/documents/${documentId}/preview`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </button>
              
              <button
                onClick={saveDocument}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowElementPanel(!showElementPanel)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Elements
              </button>
            </div>
          </div>
          
          {/* Document Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>📄 {document.sections?.length || 0} sections</span>
            <span>📊 {document.type} document</span>
            <span>👤 {document.collaborators?.length || 0} collaborators</span>
            <span>🏷️ {document.tags?.length || 0} tags</span>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Document Sections */}
        <div className="lg:col-span-4 space-y-6">
          {document.sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-white shadow rounded-lg p-6 border-2 border-transparent hover:border-indigo-200 transition-colors"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => {
                    const updatedSections = document.sections.map(s =>
                      s.id === section.id ? {...s, title: e.target.value} : s
                    );
                    setDocument({...document, sections: updatedSections});
                  }}
                  className="text-lg font-medium text-gray-900 border-none outline-none bg-transparent"
                />
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Section {index + 1}</span>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="mb-4">
                <MDEditor
                  value={section.content || ''}
                  onChange={(value) => updateSectionContent(section.id, value || '')}
                  height={300}
                  hideToolbar={false}
                  preview="edit"
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: 'Start writing your content here...',
                    style: {
                      fontSize: '16px',
                      lineHeight: '1.6',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                    }
                  }}
                />
              </div>

              {/* Multimedia Elements */}
              {section.multimedia_elements && section.multimedia_elements.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Media Elements:</h4>
                  {section.multimedia_elements.map((element, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {element.type === 'video' && <VideoCameraIcon className="h-5 w-5 text-blue-600" />}
                      {element.type === 'audio' && <SpeakerWaveIcon className="h-5 w-5 text-green-600" />}
                      {element.type === 'image' && <PhotoIcon className="h-5 w-5 text-purple-600" />}
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {element.title || `${element.type} element`}
                        </p>
                        <p className="text-xs text-gray-500">{element.url}</p>
                      </div>
                      
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Elements */}
              {section.interactive_elements && section.interactive_elements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Interactive Elements:</h4>
                  {section.interactive_elements.map((element, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                      {element.type === 'button' && <CursorArrowRippleIcon className="h-5 w-5 text-indigo-600" />}
                      {element.type === 'signature_field' && <FingerPrintIcon className="h-5 w-5 text-red-600" />}
                      {element.type === 'input_field' && <PencilIcon className="h-5 w-5 text-green-600" />}
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{element.label}</p>
                        <p className="text-xs text-gray-500 capitalize">{element.type.replace('_', ' ')}</p>
                      </div>
                      
                      {element.required && (
                        <span className="text-xs text-red-600 font-medium">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Sidebar Tools - Similar to effyDoc */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Elements</h3>
            
            {/* Tool Buttons */}
            <div className="space-y-3">
              {/* Audio Tool */}
              <button
                onClick={() => {
                  setActiveSection(document.sections[0]?.id);
                  setElementType('multimedia');
                  setMultimediaForm({...multimediaForm, type: 'audio'});
                  setShowElementPanel(true);
                }}
                className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <SpeakerWaveIcon className="h-8 w-8 text-gray-400 group-hover:text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Audio</span>
              </button>

              {/* Video Tool */}
              <button
                onClick={() => {
                  setActiveSection(document.sections[0]?.id);
                  setElementType('multimedia');
                  setMultimediaForm({...multimediaForm, type: 'video'});
                  setShowElementPanel(true);
                }}
                className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <VideoCameraIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Video</span>
              </button>

              {/* Text Tool */}
              <button
                onClick={() => {
                  const newSection = {
                    id: Date.now().toString(),
                    title: `New Section`,
                    content: 'Start writing your content here...',
                    order: document.sections.length + 1,
                    multimedia_elements: [],
                    interactive_elements: []
                  };
                  const updatedSections = [...document.sections, newSection];
                  setDocument({...document, sections: updatedSections});
                  toast.success('New text section added!');
                }}
                className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-600">Text</span>
              </button>

              {/* Image/Overlay Tool */}
              <button
                onClick={() => {
                  setActiveSection(document.sections[0]?.id);
                  setElementType('multimedia');
                  setMultimediaForm({...multimediaForm, type: 'image'});
                  setShowElementPanel(true);
                }}
                className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <PhotoIcon className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Image</span>
              </button>

              {/* Button Tool */}
              <button
                onClick={() => {
                  setActiveSection(document.sections[0]?.id);
                  setElementType('interactive');
                  setInteractiveForm({...interactiveForm, type: 'button'});
                  setShowElementPanel(true);
                }}
                className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <CursorArrowRippleIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Button</span>
              </button>

              {/* E-signature Tool */}
              <button
                onClick={() => {
                  setActiveSection(document.sections[0]?.id);
                  setElementType('interactive');
                  setInteractiveForm({...interactiveForm, type: 'signature_field'});
                  setShowElementPanel(true);
                }}
                className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <FingerPrintIcon className="h-8 w-8 text-gray-400 group-hover:text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">E-sign</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  💬 Add Comment
                </button>
                
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  📤 Share Document
                </button>
                
                <button
                  onClick={() => navigate(`/documents/${documentId}/analytics`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📊 View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Element Panel Modal */}
      {showElementPanel && <ElementPanel />}
    </div>
  );
};

export default DocumentEditor;