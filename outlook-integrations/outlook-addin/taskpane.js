/* effyDOC Outlook Add-in - Task Pane Script */

// Configuration
const EFFYDOC_API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://your-effydoc-domain.com/api';
const EFFYDOC_WEB_BASE = 'https://your-effydoc-domain.com';

// Global state
let authToken = null;
let currentUser = null;
let documents = [];

// Initialize Office.js
Office.onReady((info) => {
    if (info.host === Office.HostType.Outlook) {
        console.log('effyDOC Add-in loaded in Outlook');
        initializeAddin();
    }
});

// Initialize the add-in
function initializeAddin() {
    // Check for existing authentication
    checkAuthStatus();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data if authenticated
    if (authToken) {
        showMainContent();
        loadDocuments();
        loadAnalytics();
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('create-proposal-btn').addEventListener('click', () => createDocument('proposal'));
    document.getElementById('create-contract-btn').addEventListener('click', () => createDocument('contract'));
    document.getElementById('refresh-btn').addEventListener('click', refreshData);
    document.getElementById('view-analytics-btn').addEventListener('click', openAnalytics);
}

// Authentication
function checkAuthStatus() {
    // Check if user is already authenticated (stored in Office settings)
    Office.context.roamingSettings.loadAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            authToken = Office.context.roamingSettings.get('effydoc_token');
            currentUser = Office.context.roamingSettings.get('effydoc_user');
            
            if (authToken) {
                showMainContent();
                loadDocuments();
                loadAnalytics();
            }
        }
    });
}

// Handle login
async function handleLogin() {
    try {
        // Open authentication window
        const authUrl = `${EFFYDOC_WEB_BASE}/login?outlook_addin=true`;
        
        Office.context.ui.displayDialogAsync(
            authUrl,
            { height: 60, width: 60 },
            (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const dialog = result.value;
                    
                    dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args) => {
                        const authData = JSON.parse(args.message);
                        
                        if (authData.success) {
                            authToken = authData.token;
                            currentUser = authData.user;
                            
                            // Store authentication data
                            storeAuthData(authToken, currentUser);
                            
                            showMainContent();
                            loadDocuments();
                            loadAnalytics();
                        }
                        
                        dialog.close();
                    });
                    
                    dialog.addEventHandler(Office.EventType.DialogEventReceived, (args) => {
                        if (args.error === 12006) {
                            // Dialog was closed by user
                            console.log('Authentication dialog closed by user');
                        }
                    });
                }
            }
        );
    } catch (error) {
        console.error('Authentication error:', error);
        showError('Authentication failed. Please try again.');
    }
}

// Store authentication data
function storeAuthData(token, user) {
    Office.context.roamingSettings.set('effydoc_token', token);
    Office.context.roamingSettings.set('effydoc_user', user);
    Office.context.roamingSettings.saveAsync();
}

// Show main content
function showMainContent() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
}

// Load documents from effyDOC Platform
async function loadDocuments() {
    showLoading(true);
    
    try {
        const response = await fetch(`${EFFYDOC_API_BASE}/documents`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            documents = data.documents || [];
            renderDocuments();
        } else {
            throw new Error('Failed to load documents');
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showError('Failed to load documents');
    } finally {
        showLoading(false);
    }
}

// Render documents list
function renderDocuments() {
    const documentsList = document.getElementById('documents-list');
    
    if (documents.length === 0) {
        documentsList.innerHTML = `
            <div class="text-center py-4 text-gray-500 text-sm">
                <p>No documents found.</p>
                <p>Create your first document!</p>
            </div>
        `;
        return;
    }
    
    documentsList.innerHTML = documents.slice(0, 5).map(doc => `
        <div class="document-item p-3 border border-gray-200 rounded-lg" data-id="${doc.id}">
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900 truncate">${doc.title}</h4>
                    <p class="text-xs text-gray-600 capitalize">${doc.type}</p>
                    <p class="text-xs text-gray-500">${formatDate(doc.updated_at)}</p>
                </div>
                <div class="flex space-x-1">
                    <button class="attach-btn p-1 text-indigo-600 hover:text-indigo-800" data-id="${doc.id}" title="Attach to email">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                        </svg>
                    </button>
                    <button class="view-btn p-1 text-gray-600 hover:text-gray-800" data-id="${doc.id}" title="View document">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for document actions
    documentsList.querySelectorAll('.attach-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            attachDocument(btn.dataset.id);
        });
    });
    
    documentsList.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewDocument(btn.dataset.id);
        });
    });
}

// Load analytics summary
async function loadAnalytics() {
    try {
        const response = await fetch(`${EFFYDOC_API_BASE}/analytics/summary`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateAnalyticsSummary(data);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update analytics summary display
function updateAnalyticsSummary(data) {
    document.getElementById('total-views').textContent = data.total_views || '0';
    document.getElementById('active-docs').textContent = data.active_documents || '0';
}

// Create new document
async function createDocument(type) {
    try {
        const documentData = {
            title: type === 'proposal' ? 'New Proposal from Outlook' : 'New Contract from Outlook',
            type: type,
            organization: currentUser?.organization || 'Default Organization',
            sections: [
                {
                    id: '1',
                    title: 'Introduction',
                    content: 'Document created from Outlook add-in.',
                    order: 1,
                    multimedia_elements: [],
                    interactive_elements: []
                }
            ],
            collaborators: [],
            tags: [type, 'outlook-addin'],
            metadata: {
                created_from: 'outlook_addin',
                document_type: type
            }
        };

        const response = await fetch(`${EFFYDOC_API_BASE}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });

        if (response.ok) {
            const newDoc = await response.json();
            
            // Open document in effyDOC Platform
            const editUrl = `${EFFYDOC_WEB_BASE}/documents/${newDoc.id}/edit`;
            
            Office.context.ui.displayDialogAsync(
                editUrl,
                { height: 80, width: 80 },
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        // Refresh documents list after creation
                        setTimeout(() => {
                            loadDocuments();
                            result.value.close();
                        }, 1000);
                    }
                }
            );
        } else {
            throw new Error('Failed to create document');
        }
    } catch (error) {
        console.error('Error creating document:', error);
        showError('Failed to create document');
    }
}

// Attach document to current email
async function attachDocument(documentId) {
    try {
        const doc = documents.find(d => d.id === documentId);
        if (!doc) return;
        
        // Generate trackable link for the document
        const trackableUrl = `${EFFYDOC_WEB_BASE}/documents/${documentId}/view?utm_source=outlook_addin`;
        
        // Get current mail item
        const item = Office.context.mailbox.item;
        
        if (item.itemType === Office.MailboxEnums.ItemType.Appointment) {
            // For calendar items, add to body
            item.body.prependAsync(
                `<p><strong>effyDOC Document:</strong> <a href="${trackableUrl}">${doc.title}</a></p>`,
                { coercionType: Office.CoercionType.Html }
            );
        } else {
            // For emails, add as link in body
            item.body.prependAsync(
                `<p><strong>📄 effyDOC Document:</strong> <a href="${trackableUrl}" target="_blank">${doc.title}</a></p>`,
                { coercionType: Office.CoercionType.Html },
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        showSuccess('Document link added to email!');
                    } else {
                        console.error('Failed to attach document:', result.error);
                        showError('Failed to attach document');
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error attaching document:', error);
        showError('Failed to attach document');
    }
}

// View document
function viewDocument(documentId) {
    const viewUrl = `${EFFYDOC_WEB_BASE}/documents/${documentId}/preview`;
    
    Office.context.ui.displayDialogAsync(
        viewUrl,
        { height: 80, width: 80 },
        (result) => {
            if (result.status === Office.AsyncResultStatus.Failed) {
                console.error('Failed to open document viewer');
            }
        }
    );
}

// Open analytics dashboard
function openAnalytics() {
    const analyticsUrl = `${EFFYDOC_WEB_BASE}/analytics`;
    
    Office.context.ui.displayDialogAsync(
        analyticsUrl,
        { height: 80, width: 80 },
        (result) => {
            if (result.status === Office.AsyncResultStatus.Failed) {
                console.error('Failed to open analytics dashboard');
            }
        }
    );
}

// Refresh data
async function refreshData() {
    await Promise.all([loadDocuments(), loadAnalytics()]);
    showSuccess('Data refreshed!');
}

// Utility functions
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'p-2 bg-green-100 text-green-800 text-sm rounded-md mx-4 mb-2';
    successDiv.textContent = message;
    
    const panel = document.querySelector('.effydoc-panel');
    panel.insertBefore(successDiv, panel.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}