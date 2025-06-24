import React from 'react';

const FormattedDocumentViewer = ({ content, title }) => {
  // Clean and enhance HTML content for better display
  const enhanceContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Add styling to preserve formatting and make it look professional
    const styledContent = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        background: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        border-radius: 8px;
      ">
        ${htmlContent}
      </div>
    `;
    
    return styledContent;
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="bg-white rounded-t-lg shadow-sm p-6 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>📄 Formatted Document</span>
              <span>•</span>
              <span>Google Docs Style</span>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-b-lg shadow-sm">
          <div 
            className="formatted-document-content"
            dangerouslySetInnerHTML={{ 
              __html: enhanceContent(content) 
            }}
            style={{
              minHeight: '600px',
              padding: '20px'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .formatted-document-content {
          /* Ensure images are responsive */
        }
        
        .formatted-document-content img {
          max-width: 100%;
          height: auto;
          margin: 10px 0;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .formatted-document-content h1,
        .formatted-document-content h2,
        .formatted-document-content h3 {
          color: #1f2937;
          margin-top: 2em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .formatted-document-content h1 {
          font-size: 2.25rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        
        .formatted-document-content h2 {
          font-size: 1.875rem;
        }
        
        .formatted-document-content h3 {
          font-size: 1.5rem;
        }
        
        .formatted-document-content p {
          margin-bottom: 1em;
          color: #374151;
        }
        
        .formatted-document-content ul,
        .formatted-document-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        .formatted-document-content li {
          margin-bottom: 0.5em;
        }
        
        .formatted-document-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        
        .formatted-document-content th,
        .formatted-document-content td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
        }
        
        .formatted-document-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .formatted-document-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1.5em 0;
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 0 4px 4px 0;
        }
        
        .formatted-document-content code {
          background-color: #f1f5f9;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .formatted-document-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .formatted-document-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .formatted-document-content a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default FormattedDocumentViewer;