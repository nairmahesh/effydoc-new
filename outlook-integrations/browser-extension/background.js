/* effyDOC Browser Extension - Background Script */

// Extension configuration
const EFFYDOC_API_BASE = 'https://your-effydoc-domain.com/api';
const EFFYDOC_WEB_BASE = 'https://your-effydoc-domain.com';

// Install/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('effyDOC Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
            effydoc_settings: {
                auto_inject: true,
                show_notifications: true,
                analytics_summary: true
            }
        });
        
        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
    }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'authenticate':
            handleAuthentication(sendResponse);
            return true; // Will respond asynchronously
            
        case 'get_documents':
            getDocuments(request.token, sendResponse);
            return true;
            
        case 'create_document':
            createDocument(request.data, request.token, sendResponse);
            return true;
            
        case 'get_analytics':
            getAnalytics(request.token, sendResponse);
            return true;
            
        case 'attach_document':
            attachDocumentToEmail(request.documentId, request.token, sendResponse);
            return true;
    }
});

// Handle authentication
async function handleAuthentication(sendResponse) {
    try {
        // Open authentication tab
        const authTab = await chrome.tabs.create({
            url: `${EFFYDOC_WEB_BASE}/login?extension=true`,
            active: false
        });
        
        // Listen for authentication completion
        const listener = (tabId, changeInfo, tab) => {
            if (tabId === authTab.id && changeInfo.url) {
                if (changeInfo.url.includes('auth_success')) {
                    // Extract token from URL
                    const urlParams = new URLSearchParams(new URL(changeInfo.url).search);
                    const token = urlParams.get('token');
                    const user = JSON.parse(urlParams.get('user') || '{}');
                    
                    if (token) {
                        // Store authentication data
                        chrome.storage.sync.set({
                            effydoc_token: token,
                            effydoc_user: user,
                            auth_timestamp: Date.now()
                        });
                        
                        sendResponse({ success: true, token, user });
                        chrome.tabs.remove(authTab.id);
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                } else if (changeInfo.url.includes('auth_error')) {
                    sendResponse({ success: false, error: 'Authentication failed' });
                    chrome.tabs.remove(authTab.id);
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
        
        // Timeout after 5 minutes
        setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.remove(authTab.id);
            sendResponse({ success: false, error: 'Authentication timeout' });
        }, 300000);
        
    } catch (error) {
        console.error('Authentication error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Get documents from effyDOC API
async function getDocuments(token, sendResponse) {
    try {
        const response = await fetch(`${EFFYDOC_API_BASE}/documents`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            sendResponse({ success: true, documents: data.documents || [] });
        } else {
            throw new Error(`API error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching documents:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Create new document
async function createDocument(documentData, token, sendResponse) {
    try {
        const response = await fetch(`${EFFYDOC_API_BASE}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (response.ok) {
            const newDoc = await response.json();
            sendResponse({ success: true, document: newDoc });
        } else {
            throw new Error(`API error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error creating document:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Get analytics data
async function getAnalytics(token, sendResponse) {
    try {
        const response = await fetch(`${EFFYDOC_API_BASE}/analytics/summary`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            sendResponse({ success: true, analytics: data });
        } else {
            throw new Error(`API error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Attach document to email (generate trackable link)
async function attachDocumentToEmail(documentId, token, sendResponse) {
    try {
        const trackableUrl = `${EFFYDOC_WEB_BASE}/documents/${documentId}/view?utm_source=browser_extension`;
        
        // Get document details
        const response = await fetch(`${EFFYDOC_API_BASE}/documents/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const document = await response.json();
            sendResponse({ 
                success: true, 
                document,
                trackableUrl,
                htmlContent: generateDocumentHtml(document, trackableUrl)
            });
        } else {
            throw new Error(`API error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error attaching document:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Generate HTML content for document attachment
function generateDocumentHtml(document, trackableUrl) {
    return `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 8px 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <svg style="width: 20px; height: 20px; margin-right: 8px; color: #4f46e5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <strong style="color: #1f2937; font-size: 14px;">effyDOC Document</strong>
            </div>
            <h3 style="margin: 0 0 4px 0; color: #111827; font-size: 16px; font-weight: 600;">
                <a href="${trackableUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${document.title}</a>
            </h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: capitalize;">${document.type} • Updated ${formatDate(document.updated_at)}</p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
                📊 This document includes tracking analytics and interactive elements
            </p>
        </div>
    `;
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    // Check if we're on an Outlook page
    if (tab.url.includes('outlook.')) {
        // Inject the effyDOC panel
        chrome.tabs.sendMessage(tab.id, { action: 'toggle_panel' });
    } else {
        // Open effyDOC Platform in new tab
        chrome.tabs.create({ url: EFFYDOC_WEB_BASE });
    }
});

// Periodic cleanup of expired authentication
setInterval(async () => {
    const result = await chrome.storage.sync.get(['auth_timestamp']);
    const authTime = result.auth_timestamp;
    
    if (authTime && Date.now() - authTime > 24 * 60 * 60 * 1000) { // 24 hours
        // Clear expired authentication
        chrome.storage.sync.remove(['effydoc_token', 'effydoc_user', 'auth_timestamp']);
    }
}, 60 * 60 * 1000); // Check every hour