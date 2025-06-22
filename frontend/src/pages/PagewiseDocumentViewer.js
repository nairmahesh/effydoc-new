import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PencilIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  CursorArrowRippleIcon,
  FingerPrintIcon,
  EyeIcon,
  ClockIcon,
  CheckIcon,
  SparklesIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PagewiseDocumentViewer = () => {
  const { documentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [showSidebar, setShowSidebar] = useState(true);
  const pageRef = useRef(null);

  // Element modals
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [elementType, setElementType] = useState(null);
  const [multimediaForm, setMultimediaForm] = useState({
    type: 'video',
    url: '',
    title: '',
    description: '',
    position: { x: 0.5, y: 0.5 },
    size: { width: '200px', height: '150px' }
  });
  const [interactiveForm, setInteractiveForm] = useState({
    type: 'button',
    label: '',
    action: '',
    required: false,
    position: { x: 0.5, y: 0.3 },
    size: { width: '120px', height: '40px' }
  });

  useEffect(() => {
    if (documentId) {
      loadDocument();
      generateSessionId();
    }
  }, [documentId]);

  useEffect(() => {
    // Track page view when page changes
    if (sessionId && document) {
      trackPageView();
      setPageStartTime(Date.now());
    }
  }, [currentPage, sessionId]);

  useEffect(() => {
    // Track time spent when component unmounts or page changes
    return () => {
      if (sessionId) {
        trackPageView(true);
      }
    };
  }, [sessionId, currentPage]);

  const generateSessionId = () => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setSessionId(id);
  };

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

  const trackPageView = async (isExiting = false) => {
    if (!sessionId || !document) return;

    const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
    
    try {
      await documentsAPI.trackPageView({
        session_id: sessionId,
        document_id: documentId,
        page_number: currentPage,
        time_spent: timeSpent,
        scroll_depth: 100, // Assume full page viewed for now
        interactions: [],
        clicks: [],
        focus_areas: [],
        viewer_info: {
          ip_address: '127.0.0.1', // Will be replaced by real IP on backend
          user_agent: navigator.userAgent,
          user_id: user?.id,
          user_name: user?.full_name
        }
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const getCurrentPage = () => {
    if (!document || !document.pages || !Array.isArray(document.pages)) {
      // Fallback: create page from sections if pages don't exist
      if (document?.sections && Array.isArray(document.sections) && document.sections.length > 0) {
        const section = document.sections[currentPage - 1];
        if (section) {
          return {
            page_number: currentPage,
            title: section.title || `Page ${currentPage}`,
            content: section.content || '',
            multimedia_elements: section.multimedia_elements || [],
            interactive_elements: section.interactive_elements || []
          };
        }
      }
      return null;
    }
    return document.pages.find(page => page.page_number === currentPage);
  };

  const goToPage = (pageNumber) => {
    const totalPages = document?.total_pages || document?.pages?.length || document?.sections?.length || 1;
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      trackPageView(true); // Track current page before leaving
      setCurrentPage(pageNumber);
    }
  };

  const updatePageContent = async (content) => {
    const currentPageData = getCurrentPage();
    if (!currentPageData) return;

    try {
      await documentsAPI.updatePage(documentId, currentPage, {
        title: currentPageData.title,
        content: content,
        multimedia_elements: currentPageData.multimedia_elements,
        interactive_elements: currentPageData.interactive_elements
      });

      // Update local state
      const updatedPages = document.pages.map(page =>
        page.page_number === currentPage ? { ...page, content } : page
      );
      setDocument({ ...document, pages: updatedPages });
      
      toast.success('Page updated successfully!');
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('Failed to update page');
    }
  };

  const addMultimediaElement = async () => {
    if (!multimediaForm.url) {
      toast.error('Please provide a valid URL');
      return;
    }

    try {
      await documentsAPI.addMultimediaToPage(documentId, currentPage, multimediaForm);
      
      // Reload document to get updated data
      await loadDocument();
      setShowElementPanel(false);
      setMultimediaForm({
        type: 'video',
        url: '',
        title: '',
        description: '',
        position: { x: 0.5, y: 0.5 },
        size: { width: '200px', height: '150px' }
      });
      toast.success('Multimedia element added successfully!');
    } catch (error) {
      console.error('Error adding multimedia:', error);
      toast.error('Failed to add multimedia element');
    }
  };

  const addInteractiveElement = async () => {
    if (!interactiveForm.label) {
      toast.error('Please provide a label');
      return;
    }

    try {
      await documentsAPI.addInteractiveToPage(documentId, currentPage, interactiveForm);
      
      // Reload document to get updated data
      await loadDocument();
      setShowElementPanel(false);
      setInteractiveForm({
        type: 'button',
        label: '',
        action: '',
        required: false,
        position: { x: 0.5, y: 0.3 },
        size: { width: '120px', height: '40px' }
      });
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
              Add {elementType === 'multimedia' ? 'Multimedia' : 'Interactive'} Element to Page {currentPage}
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
                  placeholder="https://example.com/media.mp4"
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
                  Add to Page
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
                  Add to Page
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

  const currentPageData = getCurrentPage();
  const totalPages = document?.total_pages || document?.pages?.length || document?.sections?.length || 1;
  const pagesList = document?.pages && document.pages.length > 0 
    ? document.pages 
    : document?.sections?.map((section, index) => ({
        page_number: index + 1,
        title: section.title || `Page ${index + 1}`,
        content: section.content || '',
        multimedia_elements: section.multimedia_elements || [],
        interactive_elements: section.interactive_elements || []
      })) || [];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Sidebar - Page List */}
      {showSidebar && (
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">{document.title}</h3>
            <p className="text-sm text-gray-500">{totalPages} pages</p>
          </div>
          
          <div className="overflow-y-auto h-full pb-20">
            {pagesList.map((page) => (
              <div
                key={page.page_number}
                onClick={() => goToPage(page.page_number)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                  currentPage === page.page_number ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Page {page.page_number}</span>
                  {page.multimedia_elements?.length > 0 && (
                    <VideoCameraIcon className="h-4 w-4 text-blue-500" />
                  )}
                  {page.interactive_elements?.length > 0 && (
                    <FingerPrintIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{page.content.substring(0, 50)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <Bars3BottomLeftIcon className="h-5 w-5" />
              </button>
              
              <h1 className="text-xl font-semibold text-gray-900">
                Page {currentPage} of {document.total_pages}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setEditing(!editing)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  editing 
                    ? 'text-green-700 bg-green-100 hover:bg-green-200' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {editing ? <CheckIcon className="h-4 w-4 mr-1 inline" /> : <PencilIcon className="h-4 w-4 mr-1 inline" />}
                {editing ? 'Done' : 'Edit'}
              </button>

              <button
                onClick={() => navigate(`/documents/${documentId}/analytics`)}
                className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <EyeIcon className="h-4 w-4 mr-1 inline" />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Document Page Content */}
        <div className="flex-1 flex">
          {/* Page Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div 
              ref={pageRef}
              className="max-w-4xl mx-auto bg-white shadow-lg min-h-[11in] p-8 relative"
              style={{ aspectRatio: '8.5/11' }}
            >
              {/* Page Header */}
              {editing && (
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <input
                    type="text"
                    value={currentPageData?.title || ''}
                    onChange={(e) => {
                      const updatedPages = document.pages.map(page =>
                        page.page_number === currentPage ? { ...page, title: e.target.value } : page
                      );
                      setDocument({ ...document, pages: updatedPages });
                    }}
                    className="text-lg font-medium text-gray-900 border-none outline-none bg-transparent w-full"
                    placeholder="Page title..."
                  />
                </div>
              )}

              {/* Page Content */}
              {editing ? (
                <textarea
                  value={currentPageData?.content || ''}
                  onChange={(e) => updatePageContent(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Start editing page content..."
                />
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                    {currentPageData?.content || 'No content available for this page.'}
                  </div>
                </div>
              )}

              {/* Multimedia Elements */}
              {currentPageData?.multimedia_elements?.map((element, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-dashed border-blue-300 bg-blue-50 p-2 rounded"
                  style={{
                    left: `${element.position.x * 100}%`,
                    top: `${element.position.y * 100}%`,
                    width: element.size.width,
                    height: element.size.height,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {element.type === 'video' && <VideoCameraIcon className="h-4 w-4 text-blue-600" />}
                    {element.type === 'audio' && <SpeakerWaveIcon className="h-4 w-4 text-green-600" />}
                    {element.type === 'image' && <PhotoIcon className="h-4 w-4 text-purple-600" />}
                    <span className="text-xs font-medium">{element.title || element.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{element.url}</p>
                </div>
              ))}

              {/* Interactive Elements */}
              {currentPageData?.interactive_elements?.map((element, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-dashed border-red-300 bg-red-50 p-2 rounded"
                  style={{
                    left: `${element.position.x * 100}%`,
                    top: `${element.position.y * 100}%`,
                    width: element.size.width,
                    height: element.size.height,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {element.type === 'button' && <CursorArrowRippleIcon className="h-4 w-4 text-indigo-600" />}
                    {element.type === 'signature_field' && <FingerPrintIcon className="h-4 w-4 text-red-600" />}
                    {element.type === 'input_field' && <PencilIcon className="h-4 w-4 text-green-600" />}
                    <span className="text-xs font-medium">{element.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Tools */}
          {editing && (
            <div className="w-64 bg-white shadow-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">Add to Page {currentPage}</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setElementType('multimedia');
                    setMultimediaForm({...multimediaForm, type: 'audio'});
                    setShowElementPanel(true);
                  }}
                  className="w-full flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <SpeakerWaveIcon className="h-6 w-6 text-gray-400 group-hover:text-green-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Audio</span>
                </button>

                <button
                  onClick={() => {
                    setElementType('multimedia');
                    setMultimediaForm({...multimediaForm, type: 'video'});
                    setShowElementPanel(true);
                  }}
                  className="w-full flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <VideoCameraIcon className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Video</span>
                </button>

                <button
                  onClick={() => {
                    setElementType('multimedia');
                    setMultimediaForm({...multimediaForm, type: 'image'});
                    setShowElementPanel(true);
                  }}
                  className="w-full flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                >
                  <PhotoIcon className="h-6 w-6 text-gray-400 group-hover:text-purple-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Image</span>
                </button>

                <button
                  onClick={() => {
                    setElementType('interactive');
                    setInteractiveForm({...interactiveForm, type: 'button'});
                    setShowElementPanel(true);
                  }}
                  className="w-full flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <CursorArrowRippleIcon className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Button</span>
                </button>

                <button
                  onClick={() => {
                    setElementType('interactive');
                    setInteractiveForm({...interactiveForm, type: 'signature_field'});
                    setShowElementPanel(true);
                  }}
                  className="w-full flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group"
                >
                  <FingerPrintIcon className="h-6 w-6 text-gray-400 group-hover:text-red-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">E-sign</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Page Navigation */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Page</span>
              <input
                type="number"
                min="1"
                max={document.total_pages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= document.total_pages) {
                    goToPage(page);
                  }
                }}
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-700">of {document.total_pages}</span>
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === document.total_pages}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Element Panel Modal */}
      {showElementPanel && <ElementPanel />}
    </div>
  );
};

export default PagewiseDocumentViewer;