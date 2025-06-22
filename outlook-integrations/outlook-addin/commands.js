/* effyDOC Outlook Add-in - Commands Script */

// Initialize Office.js
Office.onReady(() => {
    console.log('effyDOC Commands script loaded');
});

// Quick attach document function (called from ribbon button)
function attachDocument(event) {
    // This function is called when user clicks "Attach Document" button in ribbon
    
    try {
        // Check authentication
        const authToken = Office.context.roamingSettings.get('effydoc_token');
        
        if (!authToken) {
            // Redirect to authentication
            Office.context.ui.displayDialogAsync(
                'https://your-effydoc-domain.com/login?outlook_addin=true&quick_attach=true',
                { height: 60, width: 60 },
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        handleAuthDialog(result.value, event);
                    }
                }
            );
            return;
        }
        
        // Show document picker dialog
        showDocumentPicker(authToken, event);
        
    } catch (error) {
        console.error('Error in attachDocument:', error);
        event.completed({ allowEvent: false });
    }
}

// Handle authentication dialog
function handleAuthDialog(dialog, event) {
    dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args) => {
        const authData = JSON.parse(args.message);
        
        if (authData.success) {
            // Store auth data
            Office.context.roamingSettings.set('effydoc_token', authData.token);
            Office.context.roamingSettings.set('effydoc_user', authData.user);
            Office.context.roamingSettings.saveAsync();
            
            // Now show document picker
            showDocumentPicker(authData.token, event);
        }
        
        dialog.close();
    });
}

// Show document picker dialog
function showDocumentPicker(authToken, event) {
    const pickerUrl = `https://your-effydoc-domain.com/outlook-addin/document-picker.html?token=${encodeURIComponent(authToken)}`;
    
    Office.context.ui.displayDialogAsync(
        pickerUrl,
        { height: 70, width: 60 },
        (result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                const dialog = result.value;
                
                dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args) => {
                    const data = JSON.parse(args.message);
                    
                    if (data.action === 'attach' && data.document) {
                        // Attach the selected document
                        attachSelectedDocument(data.document, event);
                    }
                    
                    dialog.close();
                });
            } else {
                event.completed({ allowEvent: false });
            }
        }
    );
}

// Attach selected document to email
function attachSelectedDocument(document, event) {
    try {
        const trackableUrl = `https://your-effydoc-domain.com/documents/${document.id}/view?utm_source=outlook_ribbon`;
        const item = Office.context.mailbox.item;
        
        const htmlContent = `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 8px 0; background: #f9fafb;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <svg style="width: 20px; height: 20px; margin-right: 8px; color: #4f46e5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <strong style="color: #1f2937;">effyDOC Document</strong>
                </div>
                <h3 style="margin: 0 0 4px 0; color: #111827;">
                    <a href="${trackableUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${document.title}</a>
                </h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: capitalize;">${document.type} • Updated ${formatDocumentDate(document.updated_at)}</p>
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
                    📊 This document includes tracking analytics and interactive elements
                </p>
            </div>
        `;
        
        item.body.prependAsync(
            htmlContent,
            { coercionType: Office.CoercionType.Html },
            (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    // Show success notification
                    Office.context.mailbox.item.notificationMessages.addAsync(
                        'effydoc-success',
                        {
                            type: 'informationalMessage',
                            message: `✅ ${document.title} attached successfully!`,
                            icon: 'iconid',
                            persistent: false
                        }
                    );
                } else {
                    console.error('Failed to attach document:', result.error);
                }
                
                event.completed({ allowEvent: true });
            }
        );
        
    } catch (error) {
        console.error('Error attaching document:', error);
        event.completed({ allowEvent: false });
    }
}

// Utility function to format date
function formatDocumentDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Register function for Office.js
Office.actions.associate("attachDocument", attachDocument);