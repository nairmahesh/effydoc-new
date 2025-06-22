#!/bin/bash

# effyDOC Outlook Integrations - Configuration Script
# This script updates all placeholder URLs with your actual domain

echo "🚀 effyDOC Outlook Integrations Configuration"
echo "=============================================="

# Get domain from user
read -p "Enter your effyDOC Platform domain (e.g., https://yoursite.com): " DOMAIN

# Remove trailing slash if present
DOMAIN=${DOMAIN%/}

echo "📝 Updating configuration files with domain: $DOMAIN"

# Update Outlook Add-in files
echo "Updating Outlook Add-in configuration..."
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" outlook-addin/manifest.xml
sed -i "s|https://your-domain.com|$DOMAIN|g" outlook-addin/manifest.xml
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" outlook-addin/taskpane.js
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" outlook-addin/commands.js

# Update Browser Extension files
echo "Updating Browser Extension configuration..."
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" browser-extension/manifest.json
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" browser-extension/background.js
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" browser-extension/content.js
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" browser-extension/popup.js
sed -i "s|https://your-effydoc-domain.com|$DOMAIN|g" browser-extension/popup.html

echo "✅ Configuration complete!"
echo ""
echo "📁 Files updated:"
echo "   Outlook Add-in: manifest.xml, taskpane.js, commands.js"
echo "   Browser Extension: manifest.json, background.js, content.js, popup.js, popup.html"
echo ""
echo "🔧 Next steps:"
echo "   1. Host outlook-addin/ folder on your HTTPS server"
echo "   2. Load browser-extension/ as unpacked extension in Chrome/Edge"
echo "   3. Follow deployment-guide.md for detailed instructions"
echo ""
echo "🎉 Your effyDOC Outlook Integrations are ready for deployment!"