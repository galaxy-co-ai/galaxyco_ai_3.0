# 🚀 Quick Start Guide - GalaxyCo.ai

Get up and running with GalaxyCo.ai in under 5 minutes!

## ⚡ Fast Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:5173
```

That's it! You're ready to go! 🎉

## 🎯 First Steps

### 1. Experience the Landing Page
- The app starts on the beautiful landing page
- Explore the platform showcase
- Click "Enter App" in the top navigation

### 2. Complete Onboarding
- First time users see the onboarding wizard
- Connect essential apps (Gmail, Google Calendar)
- Optionally add more apps (Slack, Notion, etc.)
- Watch the celebration confetti! 🎊

### 3. Explore the Dashboard
- View real-time agent activity
- Check the stock ticker for live stats
- Review the activity feed
- Try quick actions

### 4. Build a Workflow in Studio
- Navigate to Studio from sidebar
- Choose a template or start from scratch
- Drag nodes from the palette
- Connect them to create automation
- Test your workflow

### 5. Manage Knowledge
- Go to Knowledge Base
- Browse folders or search
- Upload documents (simulated)
- See AI recommendations

## 🎮 Navigation

### Sidebar Menu
- 🏠 **Landing** - Marketing landing page
- 📊 **Dashboard** - Main overview
- 🎨 **Studio** - Workflow builder
- 📚 **Knowledge Base** - Document management
- 💼 **CRM** - Customer relationships
- 📢 **Marketing** - Campaigns
- ✨ **AI Assistant** - Coming soon
- 🔌 **Integrations** - Connected apps
- ⚙️ **Settings** - Coming soon

### Keyboard Shortcuts
- Press `?` to see all shortcuts (coming soon)
- `Cmd/Ctrl + K` - Quick search (coming soon)

## 🎨 Key Features to Try

### Landing Page
✨ Full-width marketing site with:
- Animated hero section
- Platform preview cards
- Interactive CTAs
- Smooth scroll animations

### Onboarding Flow
🎓 4-step guided setup:
1. Welcome screen
2. Connect essential apps
3. Add additional apps
4. Success celebration

### Visual Workflow Builder
🎨 Powerful Studio features:
- Drag-and-drop nodes
- Visual connections
- Node configuration
- Templates library
- Live testing
- Minimap navigation

### Knowledge Base
📚 Smart document management:
- Folder organization
- AI-powered search
- Document previews
- File type detection
- Recommendations

### CRM
💼 AI-native customer management:
- Contact cards
- Deal pipeline
- Activity tracking
- AI transcriptions
- Meeting integration

### Marketing
📢 Campaign intelligence:
- Performance tracking
- ROI visualization
- Multi-channel support
- Visual analytics

## 🔄 Resetting the App

### Reset Onboarding
```javascript
// Open browser console and run:
localStorage.removeItem("galaxyco_onboarding_completed")
// Then refresh the page
```

Or click "Guided Setup" button in the Integrations page.

### Clear All Data
```javascript
// Open browser console and run:
localStorage.clear()
// Then refresh the page
```

## 🎨 Customization

### Change Primary Color
Edit `/styles/globals.css`:
```css
@theme {
  --color-primary: #007AFF; /* Change this */
}
```

### Modify Typography
Edit heading styles in `/styles/globals.css`:
```css
h1 { /* Customize */ }
h2 { /* Customize */ }
```

### Add New Page
1. Create file in `/pages/YourPage.tsx`
2. Add route in `/App.tsx`
3. Add menu item in `/components/AppSidebar.tsx`

## 📱 Test Responsive Design

### Mobile View
- Resize browser to < 640px
- Or use Chrome DevTools (F12 → Device Toolbar)
- Test navigation and interactions

### Tablet View
- Resize to 640px - 1024px
- Check grid layouts
- Verify touch interactions

### Desktop View
- Full width > 1024px
- Test all features
- Check sidebar behavior

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules
npm install
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .vite
npm run build
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit
```

## 🎯 Pro Tips

1. **Start with Templates** - Use workflow templates in Studio
2. **Explore Integrations** - See all available connections
3. **Check Activity Feed** - Monitor AI agent activity
4. **Use Quick Actions** - Fast access to common tasks
5. **Try Floating Assistant** - Click the AI icon in bottom right
6. **Browse Documents** - Click "Documents" in top header
7. **Watch Animations** - Smooth transitions throughout
8. **Test Onboarding** - Reset and complete multiple times

## 📚 Learn More

- **README.md** - Full project overview
- **PROJECT_SUMMARY.md** - Complete feature list
- **Guidelines.md** - Development guidelines
- **Attributions.md** - Third-party credits

## 🤝 Need Help?

- Check the documentation files
- Review component code for examples
- Look at the file structure
- Open browser console for errors

## 🎉 You're Ready!

Start exploring GalaxyCo.ai and see what AI-native workflows can do!

### Suggested Exploration Path:
1. ✅ View Landing Page
2. ✅ Complete Onboarding
3. ✅ Explore Dashboard
4. ✅ Create a Workflow in Studio
5. ✅ Browse Knowledge Base
6. ✅ Check CRM Features
7. ✅ View Marketing Analytics
8. ✅ Review Integrations
9. ✅ Try Floating AI Assistant
10. ✅ Check Responsive Design

---

**Happy Building!** 🚀

Questions? The code is well-documented and ready to explore!
