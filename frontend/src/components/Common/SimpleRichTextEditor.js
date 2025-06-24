import React, { useState, useRef, useEffect } from 'react';

const SimpleRichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
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

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 flex items-center space-x-1">
        <button
          type="button"
          onClick={() => handleCommand('bold')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => handleCommand('italic')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => handleCommand('underline')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 underline"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        <button
          type="button"
          onClick={() => handleCommand('insertUnorderedList')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => handleCommand('insertOrderedList')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Numbered List"
        >
          1. List
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'h1')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'h2')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'p')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Paragraph"
        >
          P
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={`min-h-64 p-4 outline-none ${
          isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          fontSize: '16px',
          lineHeight: '1.6'
        }}
        suppressContentEditableWarning={true}
      >
        {!value && (
          <div className="text-gray-400 pointer-events-none">
            {placeholder || 'Start writing your content here...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;