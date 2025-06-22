# effyDOC Outlook Integrations - Deployment Guide

## 🎯 **Quick Deployment Checklist**

### **Pre-Deployment Setup:**
- [ ] Replace all `https://your-effydoc-domain.com` URLs with your actual domain
- [ ] Host Outlook Add-in files on HTTPS server
- [ ] Prepare icon files (16x16, 32x32, 48x48, 80x80, 128x128 pixels)
- [ ] Test effyDOC Platform API endpoints are accessible

---

## 🔧 **1. Outlook Add-in Deployment**

### **Step 1: Update Configuration**
```xml
<!-- In manifest.xml, replace: -->
<AppDomains>
    <AppDomain>https://YOUR-ACTUAL-DOMAIN.com</AppDomain>
</AppDomains>

<!-- Update all SourceLocation URLs -->
```

### **Step 2: Host Files**
```bash
# Upload to your web server:
https://your-domain.com/outlook-addin/
├── manifest.xml
├── taskpane.html
├── taskpane.js
├── commands.html
├── commands.js
└── assets/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    ├── icon-80.png
    └── icon-128.png
```

### **Step 3: Install Methods**

#### **Method A: Side-loading (Testing)**
1. Open Outlook Web App or Desktop
2. Go to Settings → Manage Add-ins
3. Click "My add-ins" → "Add a custom add-in"
4. Choose "Add from URL" 
5. Enter: `https://your-domain.com/outlook-addin/manifest.xml`

#### **Method B: Enterprise Deployment**
1. Office Admin Center → Settings → Integrated apps
2. Upload custom app → Upload manifest file
3. Deploy to specific users/groups
4. Add-in appears in user's Outlook automatically

#### **Method C: Microsoft AppSource (Public)**
1. Package add-in for store submission
2. Submit to Microsoft AppSource
3. Wait for approval process
4. Users install from Office Store

---

## 🌐 **2. Browser Extension Deployment**

### **Step 1: Update Configuration**
```json
// In manifest.json, update:
"externally_connectable": {
    "matches": [
        "https://YOUR-ACTUAL-DOMAIN.com/*"
    ]
}
```

### **Step 2: Package Extension**
```bash
# Create extension package:
cd browser-extension/
zip -r effydoc-outlook-extension.zip ./*

# Or use Chrome Extension tools
```

### **Step 3: Deploy Extension**

#### **Method A: Enterprise Deployment**
1. Google Admin Console → Apps → Additional Google Services
2. Chrome Management → Apps & Extensions
3. Upload private extension (.crx file)
4. Deploy to organizational units

#### **Method B: Chrome Web Store (Public)**
1. Chrome Developer Dashboard
2. Upload extension package
3. Complete store listing
4. Submit for review
5. Publish after approval

#### **Method C: Direct Installation (Testing)**
1. Chrome/Edge → Extensions → Developer Mode
2. "Load unpacked" → Select browser-extension folder
3. Extension installs immediately for testing

---

## 🔐 **3. Security Configuration**

### **CORS Settings (Backend)**
```python
# In your FastAPI backend:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.com",
        "https://outlook.live.com",
        "https://outlook.office365.com",
        "https://outlook.office.com",
        "moz-extension://*",  # Firefox
        "chrome-extension://*"  # Chrome/Edge
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Content Security Policy**
```html
<!-- Add to your effyDOC Platform pages: -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://outlook.live.com https://outlook.office365.com;
               frame-ancestors 'self' https://outlook.live.com https://outlook.office365.com;">
```

---

## 📊 **4. Analytics & Monitoring**

### **Track Integration Usage:**
```javascript
// Add to your analytics:
- outlook_addin_installs
- browser_extension_installs  
- documents_created_from_outlook
- email_attachments_via_extension
- user_engagement_metrics
```

### **Monitor Performance:**
- API response times from integrations
- Authentication success rates
- Document attachment click-through rates
- User adoption metrics

---

## 🧪 **5. Testing Checklist**

### **Outlook Add-in Testing:**
- [ ] Add-in loads in Outlook Web App
- [ ] Add-in loads in Outlook Desktop
- [ ] Authentication flow works
- [ ] Document creation functions
- [ ] Document attachment works
- [ ] Analytics display correctly
- [ ] Ribbon buttons respond
- [ ] Error handling works

### **Browser Extension Testing:**
- [ ] Extension installs successfully
- [ ] Panel appears in Outlook Web App
- [ ] Authentication flows work
- [ ] Document creation from extension
- [ ] Smart attachment feature
- [ ] Popup interface functions
- [ ] Content script injection works
- [ ] Cross-browser compatibility (Chrome/Edge)

---

## 🎉 **6. User Onboarding**

### **Documentation for Users:**
1. **Installation Guide** - How to install both integrations
2. **Feature Overview** - What each integration does
3. **Quick Start** - First-time setup and authentication
4. **Best Practices** - How to use effectively
5. **Troubleshooting** - Common issues and solutions

### **Training Materials:**
- Video tutorials for each integration
- Screenshot guides for installation
- Feature demonstration videos
- IT admin deployment guides

---

## 🚀 **Production Deployment Summary**

### **For Outlook Add-in:**
1. Host files on HTTPS server ✅
2. Update all domain URLs ✅
3. Deploy via Admin Center ✅
4. Train users on features ✅

### **For Browser Extension:**
1. Package extension properly ✅
2. Deploy via enterprise tools ✅
3. Or publish to Chrome Web Store ✅
4. Monitor adoption metrics ✅

Both integrations are **enterprise-ready** and provide seamless effyDOC access directly from Outlook environments!