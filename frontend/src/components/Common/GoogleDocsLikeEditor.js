import React, { useState, useRef, useEffect } from 'react';

const GoogleDocsLikeEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      // Set HTML content while preserving ALL formatting including images
      if (value && value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    // Allow rich content pasting with images
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text/html') || 
                 (e.clipboardData || window.clipboardData).getData('text/plain');
    
    if (paste) {
      // Use insertHTML to preserve all formatting and images
      document.execCommand('insertHTML', false, paste);
      handleInput();
    }
  };

  const handleCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const handleKeyDown = (e) => {
    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          handleCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          handleCommand('underline');
          break;
        default:
          break;
      }
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = `<img src="${event.target.result}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        document.execCommand('insertHTML', false, img);
        handleInput();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset file input
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Google Docs-like Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50 flex items-center space-x-1 flex-wrap">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => handleCommand('bold')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => handleCommand('italic')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => handleCommand('underline')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 underline"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Font Size */}
        <select
          onChange={(e) => handleCommand('fontSize', e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
          title="Font Size"
        >
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">X-Large</option>
        </select>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Text Color */}
        <input
          type="color"
          onChange={(e) => handleCommand('foreColor', e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="Text Color"
        />
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Lists */}
        <button
          type="button"
          onClick={() => handleCommand('insertUnorderedList')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => handleCommand('insertOrderedList')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Numbered List"
        >
          1. List
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Headings */}
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'h1')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'h2')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 font-semibold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'h3')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 font-medium"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'p')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Paragraph"
        >
          P
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Alignment */}
        <button
          type="button"
          onClick={() => handleCommand('justifyLeft')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Align Left"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => handleCommand('justifyCenter')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Center"
        >
          ⬆
        </button>
        <button
          type="button"
          onClick={() => handleCommand('justifyRight')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Align Right"
        >
          ➡
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        {/* Insert Image */}
        <label className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 cursor-pointer" title="Insert Image">
          🖼️ Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        
        {/* Insert Link */}
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) handleCommand('createLink', url);
          }}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Insert Link"
        >
          🔗
        </button>
      </div>

      {/* Google Docs-like Editor Area - PRESERVE ALL CONTENT */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={`min-h-96 p-8 outline-none ${
          isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          fontSize: '16px',
          lineHeight: '1.6',
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white'
        }}
        suppressContentEditableWarning={true}
      >
        {value ? (
          <div dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <div className="text-gray-400 pointer-events-none">
            {placeholder || 'Start writing your content here...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDocsLikeEditor;