/* effyDOC Browser Extension - Popup Script */

// DOM elements
const notConnectedDiv = document.getElementById('not-connected');
const connectedDiv = document.getElementById('connected');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const createProposalBtn = document.getElementById('create-proposal-btn');
const createContractBtn = document.getElementById('create-contract-btn');
const userNameEl = document.getElementById('user-name');
const totalDocsEl = document.getElementById('total-docs');
const totalViewsEl = document.getElementById('total-views');

// Initialize popup
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
    try {
        // Check authentication status
        const result = await chrome.storage.sync.get(['effydoc_token', 'effydoc_user']);
        
        if (result.effydoc_token && result.effydoc_user) {
            showConnectedState(result.effydoc_user);
            await loadStats(result.effydoc_token);
        } else {
            showNotConnectedState();
        }
    } catch (error) {
        console.error('Error initializing popup:', error);
        showNotConnectedState();
    }
}

function showConnectedState(user) {
    notConnectedDiv.classList.add('hidden');
    connectedDiv.classList.remove('hidden');
    
    if (user && user.full_name) {
        userNameEl.textContent = `Welcome, ${user.full_name}!`;
    }
}

function showNotConnectedState() {
    connectedDiv.classList.add('hidden');
    notConnectedDiv.classList.remove('hidden');
}

async function loadStats(token) {
    try {
        // Send message to background script to get stats
        const response = await chrome.runtime.sendMessage({
            action: 'get_analytics',
            token: token
        });
        
        if (response && response.success) {
            const analytics = response.analytics;
            totalDocsEl.textContent = analytics.active_documents || '0';
            totalViewsEl.textContent = analytics.total_views || '0';
        }
        
        // Also get document count
        const docsResponse = await chrome.runtime.sendMessage({
            action: 'get_documents',
            token: token
        });
        
        if (docsResponse && docsResponse.success) {
            totalDocsEl.textContent = docsResponse.documents.length || '0';
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set default values on error
        totalDocsEl.textContent = '0';
        totalViewsEl.textContent = '0';
    }
}

// Event listeners
connectBtn.addEventListener('click', async () => {
    try {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';
        
        // Send authentication message to background script
        const response = await chrome.runtime.sendMessage({ action: 'authenticate' });
        
        if (response && response.success) {
            showConnectedState(response.user);
            await loadStats(response.token);
        } else {
            console.error('Authentication failed:', response?.error);
        }
    } catch (error) {
        console.error('Error during authentication:', error);
    } finally {
        connectBtn.disabled = false;
        connectBtn.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Sign In to effyDOC
        `;
    }
});

disconnectBtn.addEventListener('click', async () => {
    try {
        // Clear stored authentication
        await chrome.storage.sync.remove(['effydoc_token', 'effydoc_user', 'auth_timestamp']);
        showNotConnectedState();
    } catch (error) {
        console.error('Error during disconnect:', error);
    }
});

createProposalBtn.addEventListener('click', async () => {
    await createDocument('proposal');
});

createContractBtn.addEventListener('click', async () => {
    await createDocument('contract');
});

async function createDocument(type) {
    try {
        const result = await chrome.storage.sync.get(['effydoc_token', 'effydoc_user']);
        
        if (!result.effydoc_token) {
            console.error('Not authenticated');
            return;
        }
        
        const documentData = {
            title: type === 'proposal' ? 'New Proposal from Extension' : 'New Contract from Extension',
            type: type,
            organization: result.effydoc_user?.organization || 'Default Organization',
            sections: [
                {
                    id: '1',
                    title: 'Introduction',
                    content: 'Document created from browser extension.',
                    order: 1,
                    multimedia_elements: [],
                    interactive_elements: []
                }
            ],
            collaborators: [],
            tags: [type, 'browser-extension'],
            metadata: {
                created_from: 'browser_extension',
                document_type: type
            }
        };

        const response = await chrome.runtime.sendMessage({
            action: 'create_document',
            data: documentData,
            token: result.effydoc_token
        });

        if (response && response.success) {
            // Open document in new tab
            const editUrl = `https://your-effydoc-domain.com/documents/${response.document.id}/edit`;
            await chrome.tabs.create({ url: editUrl });
            
            // Close popup
            window.close();
        } else {
            console.error('Failed to create document:', response?.error);
        }
    } catch (error) {
        console.error('Error creating document:', error);
    }
}