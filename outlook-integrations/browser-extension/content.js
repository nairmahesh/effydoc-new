/* effyDOC Browser Extension - Content Script */

// Configuration
const EXTENSION_ID = chrome.runtime.id;
let effyDOCPanel = null;
let isAuthenticated = false;
let authToken = null;
let currentUser = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Initialize the extension
async function initializeExtension() {
    console.log('effyDOC Extension: Initializing on Outlook Web App');
    
    // Check authentication status
    await checkAuthStatus();
    
    // Create effyDOC panel
    createEffyDOCPanel();
    
    // Add toolbar button to Outlook interface
    addToolbarButton();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Monitor for email compose windows
    observeEmailCompose();
}

// Check authentication status
async function checkAuthStatus() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['effydoc_token', 'effydoc_user'], (result) => {
            if (result.effydoc_token) {
                authToken = result.effydoc_token;
                currentUser = result.effydoc_user;
                isAuthenticated = true;
            }
            resolve();
        });
    });
}

// Handle messages from background script and popup
function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
        case 'toggle_panel':
            toggleEffyDOCPanel();
            break;
            
        case 'auth_updated':
            authToken = request.token;
            currentUser = request.user;
            isAuthenticated = true;
            updatePanelContent();
            break;
            
        case 'insert_document':
            insertDocumentIntoCompose(request.document, request.htmlContent);
            break;
    }
    
    sendResponse({ success: true });
}

// Create effyDOC panel
function createEffyDOCPanel() {
    // Create panel container
    effyDOCPanel = document.createElement('div');
    effyDOCPanel.id = 'effydoc-panel';
    effyDOCPanel.className = 'effydoc-panel-hidden';
    
    effyDOCPanel.innerHTML = `
        <div class="effydoc-panel-content">
            <div class="effydoc-header">
                <div class="effydoc-logo">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>effyDOC</span>
                </div>
                <button class="effydoc-close" onclick="toggleEffyDOCPanel()">×</button>
            </div>
            
            <div id="effydoc-content">
                <!-- Content will be loaded here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(effyDOCPanel);
    
    // Update content based on authentication status
    updatePanelContent();
}

// Update panel content
function updatePanelContent() {
    const contentDiv = document.getElementById('effydoc-content');
    
    if (!isAuthenticated) {
        contentDiv.innerHTML = `
            <div class="effydoc-auth">
                <h3>Connect to effyDOC Platform</h3>
                <p>Access your documents and analytics directly from Outlook</p>
                <button class="effydoc-btn effydoc-btn-primary" onclick="authenticateEffyDOC()">
                    Sign In to effyDOC
                </button>
            </div>
        `;
    } else {
        contentDiv.innerHTML = `
            <div class="effydoc-authenticated">
                <div class="effydoc-user-info">
                    <p>Welcome, ${currentUser?.full_name || 'User'}!</p>
                </div>
                
                <div class="effydoc-quick-actions">
                    <h4>Quick Actions</h4>
                    <div class="effydoc-action-grid">
                        <button class="effydoc-action-btn" onclick="createDocument('proposal')">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            New Proposal
                        </button>
                        <button class="effydoc-action-btn" onclick="createDocument('contract')">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            New Contract
                        </button>
                    </div>
                </div>
                
                <div class="effydoc-documents">
                    <h4>Recent Documents</h4>
                    <div id="effydoc-documents-list" class="effydoc-loading">
                        <div class="effydoc-spinner"></div>
                        <p>Loading documents...</p>
                    </div>
                </div>
                
                <div class="effydoc-analytics">
                    <h4>Analytics Summary</h4>
                    <div id="effydoc-analytics-summary" class="effydoc-analytics-grid">
                        <div class="effydoc-metric">
                            <span class="effydoc-metric-value" id="total-views">-</span>
                            <span class="effydoc-metric-label">Total Views</span>
                        </div>
                        <div class="effydoc-metric">
                            <span class="effydoc-metric-value" id="active-docs">-</span>
                            <span class="effydoc-metric-label">Active Docs</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load documents and analytics
        loadDocuments();
        loadAnalytics();
    }
}

// Add toolbar button to Outlook interface
function addToolbarButton() {
    // Try to find Outlook's toolbar
    const toolbar = document.querySelector('[data-testid="compose-toolbar"]') ||
                   document.querySelector('.ms-CommandBar') ||
                   document.querySelector('[role="toolbar"]');
    
    if (toolbar) {
        const effyDOCButton = document.createElement('button');
        effyDOCButton.className = 'effydoc-toolbar-btn';
        effyDOCButton.title = 'effyDOC Platform';
        effyDOCButton.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            effyDOC
        `;
        effyDOCButton.onclick = toggleEffyDOCPanel;
        
        toolbar.appendChild(effyDOCButton);
    }
    
    // Also try to add to compose windows specifically
    setTimeout(() => {
        addComposeButtons();
    }, 2000);
}

// Add buttons to email compose windows
function addComposeButtons() {
    const composeWindows = document.querySelectorAll('[data-testid="compose-body-wrapper"]');
    
    composeWindows.forEach(composeWindow => {
        if (!composeWindow.querySelector('.effydoc-compose-btn')) {
            const composeButton = document.createElement('button');
            composeButton.className = 'effydoc-compose-btn';
            composeButton.innerHTML = '📄 Attach effyDOC';
            composeButton.onclick = () => showDocumentPicker(composeWindow);
            
            const toolbar = composeWindow.querySelector('.ms-CommandBar') ||
                           composeWindow.querySelector('[role="toolbar"]');
            
            if (toolbar) {
                toolbar.appendChild(composeButton);
            }
        }
    });
}

// Toggle effyDOC panel visibility
function toggleEffyDOCPanel() {
    if (effyDOCPanel.classList.contains('effydoc-panel-hidden')) {
        effyDOCPanel.classList.remove('effydoc-panel-hidden');
        effyDOCPanel.classList.add('effydoc-panel-visible');
    } else {
        effyDOCPanel.classList.remove('effydoc-panel-visible');
        effyDOCPanel.classList.add('effydoc-panel-hidden');
    }
}

// Authenticate with effyDOC
function authenticateEffyDOC() {
    chrome.runtime.sendMessage(
        { action: 'authenticate' },
        (response) => {
            if (response && response.success) {
                authToken = response.token;
                currentUser = response.user;
                isAuthenticated = true;
                updatePanelContent();
            } else {
                console.error('Authentication failed:', response?.error);
            }
        }
    );
}

// Create new document
function createDocument(type) {
    const documentData = {
        title: type === 'proposal' ? 'New Proposal from Outlook' : 'New Contract from Outlook',
        type: type,
        organization: currentUser?.organization || 'Default Organization',
        sections: [
            {
                id: '1',
                title: 'Introduction',
                content: 'Document created from Outlook Web App extension.',
                order: 1,
                multimedia_elements: [],
                interactive_elements: []
            }
        ],
        collaborators: [],
        tags: [type, 'outlook-extension'],
        metadata: {
            created_from: 'outlook_extension',
            document_type: type
        }
    };

    chrome.runtime.sendMessage(
        { action: 'create_document', data: documentData, token: authToken },
        (response) => {
            if (response && response.success) {
                // Open document in new tab
                const editUrl = `https://your-effydoc-domain.com/documents/${response.document.id}/edit`;
                window.open(editUrl, '_blank');
                
                // Refresh documents list
                setTimeout(loadDocuments, 1000);
            } else {
                console.error('Failed to create document:', response?.error);
            }
        }
    );
}

// Load documents
function loadDocuments() {
    chrome.runtime.sendMessage(
        { action: 'get_documents', token: authToken },
        (response) => {
            if (response && response.success) {
                renderDocuments(response.documents);
            } else {
                console.error('Failed to load documents:', response?.error);
            }
        }
    );
}

// Render documents list
function renderDocuments(documents) {
    const documentsList = document.getElementById('effydoc-documents-list');
    
    if (!documents || documents.length === 0) {
        documentsList.innerHTML = `
            <div class="effydoc-empty">
                <p>No documents found.</p>
                <p>Create your first document!</p>
            </div>
        `;
        return;
    }
    
    documentsList.innerHTML = documents.slice(0, 5).map(doc => `
        <div class="effydoc-document-item" data-id="${doc.id}">
            <div class="effydoc-document-info">
                <h5>${doc.title}</h5>
                <p>${doc.type} • ${formatDate(doc.updated_at)}</p>
            </div>
            <div class="effydoc-document-actions">
                <button class="effydoc-btn-small" onclick="attachDocument('${doc.id}')">Attach</button>
                <button class="effydoc-btn-small" onclick="viewDocument('${doc.id}')">View</button>
            </div>
        </div>
    `).join('');
}

// Load analytics
function loadAnalytics() {
    chrome.runtime.sendMessage(
        { action: 'get_analytics', token: authToken },
        (response) => {
            if (response && response.success) {
                updateAnalytics(response.analytics);
            }
        }
    );
}

// Update analytics display
function updateAnalytics(analytics) {
    const totalViewsEl = document.getElementById('total-views');
    const activeDocsEl = document.getElementById('active-docs');
    
    if (totalViewsEl) totalViewsEl.textContent = analytics.total_views || '0';
    if (activeDocsEl) activeDocsEl.textContent = analytics.active_documents || '0';
}

// Attach document to current email
function attachDocument(documentId) {
    chrome.runtime.sendMessage(
        { action: 'attach_document', documentId, token: authToken },
        (response) => {
            if (response && response.success) {
                insertDocumentIntoCompose(response.document, response.htmlContent);
            } else {
                console.error('Failed to attach document:', response?.error);
            }
        }
    );
}

// Insert document into email compose
function insertDocumentIntoCompose(document, htmlContent) {
    // Find active compose window
    const activeCompose = document.querySelector('[data-testid="compose-body-wrapper"] [contenteditable="true"]') ||
                         document.querySelector('.ms-TextField-field[contenteditable="true"]') ||
                         document.querySelector('[role="textbox"][contenteditable="true"]');
    
    if (activeCompose) {
        // Insert at cursor position or at the beginning
        if (activeCompose.innerHTML.trim() === '') {
            activeCompose.innerHTML = htmlContent + '<br><br>';
        } else {
            activeCompose.innerHTML = htmlContent + '<br>' + activeCompose.innerHTML;
        }
        
        // Trigger change event
        activeCompose.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Show success message
        showNotification(`✅ ${document.title} attached successfully!`);
    } else {
        showNotification('❌ Please open an email compose window first');
    }
}

// View document
function viewDocument(documentId) {
    const viewUrl = `https://your-effydoc-domain.com/documents/${documentId}/preview`;
    window.open(viewUrl, '_blank');
}

// Show document picker for compose window
function showDocumentPicker(composeWindow) {
    if (!isAuthenticated) {
        authenticateEffyDOC();
        return;
    }
    
    // For now, just toggle the main panel
    toggleEffyDOCPanel();
}

// Observe email compose windows
function observeEmailCompose() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if new compose window was added
                        if (node.querySelector && node.querySelector('[data-testid="compose-body-wrapper"]')) {
                            setTimeout(addComposeButtons, 500);
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'effydoc-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('effydoc-notification-show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('effydoc-notification-show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Utility function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

// Make functions available globally for onclick handlers
window.toggleEffyDOCPanel = toggleEffyDOCPanel;
window.authenticateEffyDOC = authenticateEffyDOC;
window.createDocument = createDocument;
window.attachDocument = attachDocument;
window.viewDocument = viewDocument;