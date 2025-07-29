# ImageCraft Pro 🎨

A modern Progressive Web Application (PWA) for advanced image processing, editing, and AI-powered transformations with a stunning glass morphism UI.

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## 🌟 Overview

ImageCraft Pro is a cutting-edge web application that brings professional-grade image editing capabilities to your browser. Built with React and styled with Tailwind CSS, it features a beautiful glass morphism design with animated backgrounds and smooth transitions.

## ✨ Features

### Core Capabilities
- **📤 Image Upload**: Drag-and-drop interface for easy file handling
- **🎨 AI-Powered Editing**: Smart image transformations and enhancements
- **🖼️ Advanced Processing**: Professional-grade image manipulation tools
- **📱 PWA Support**: Install as a native app on any device
- **🎭 Glass Morphism UI**: Modern, translucent design with blur effects
- **🌈 Animated Backgrounds**: Dynamic gradients and floating elements

### Image Processing Tools
- **Remove Background**: AI-powered background removal
- **Image Enhancement**: Smart upscaling and quality improvement
- **Color Grading**: Professional color correction and filters
- **Creative Effects**: Artistic transformations and style transfers
- **Batch Processing**: Handle multiple images simultaneously
- **Format Conversion**: Support for various image formats

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.2.0**: Modern React with hooks and functional components
- **Create React App**: Optimized build configuration

### Styling & Design
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **PostCSS**: CSS transformations and optimizations
- **Autoprefixer**: Cross-browser compatibility
- **Glass Morphism**: Custom backdrop blur effects

### Libraries & Tools
- **Lucide React**: Beautiful, consistent icon library
- **Workbox**: PWA and service worker management
- **React Scripts**: Development and build tooling

## 📁 Project Structure

```
imagecraft-pro/
├── README.md                    # Project documentation
├── package.json                 # Root package configuration
└── imagecraft-pwa/             # Main application
    ├── public/                 # Static assets
    │   ├── index.html         # HTML template
    │   ├── manifest.json      # PWA manifest
    │   └── logo192.png        # App icon
    ├── src/                   # Source code
    │   ├── ImageProcessingApp.js  # Main application component
    │   ├── index.js              # React entry point
    │   ├── index.css             # Global styles with Tailwind
    │   └── serviceWorkerRegistration.js  # PWA service worker
    ├── package.json           # Dependencies and scripts
    ├── tailwind.config.js     # Tailwind configuration
    └── postcss.config.js      # PostCSS configuration
```

## 🏗️ Frontend Architecture

### Component Hierarchy

```
ImageProcessingApp (Root)
├── AnimatedBackground    # Dynamic background animations
├── Navigation           # Responsive navigation bar
├── Sections            # Main content sections
│   ├── Upload          # File upload interface
│   ├── Edit           # Image editing tools
│   ├── AI Tools       # AI-powered features
│   ├── Export         # Download and sharing
│   └── About          # Application information
└── Components         # Reusable UI components
    ├── GlassCard     # Glass morphism containers
    ├── GlassButton   # Styled action buttons
    ├── UploadZone    # Drag-and-drop area
    └── FeatureCard   # Feature showcase cards
```

### Design System

#### Color Palette
- **Primary**: Orange gradient (#f97316 → #fb923c)
- **Accent**: Light orange (#fed7aa)
- **Text**: Dark gray (#1f2937) on light backgrounds
- **Glass**: Semi-transparent white (rgba(255, 255, 255, 0.2))

#### Typography
- **Headings**: Poppins (Google Fonts)
- **Body**: Inter (Google Fonts)
- **Icons**: Lucide React icons

#### Animations
- **Transitions**: 300-500ms ease-in-out
- **Hover Effects**: Scale and shadow transformations
- **Background**: Floating orbs with rotation
- **Loading**: Pulse and wave animations

## 🚀 Getting Started

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sharvinzlife/imagecraft-pro.git
cd imagecraft-pro
```

2. Navigate to the PWA directory:
```bash
cd imagecraft-pwa
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## 📱 PWA Installation

ImageCraft Pro can be installed as a Progressive Web App:

1. **Desktop**: Click the install icon in the browser's address bar
2. **Mobile**: Use the "Add to Home Screen" option in your browser menu
3. **Features**: Offline support, native-like experience, automatic updates

## 🎨 UI Components

### Glass Card Component
```jsx
<GlassCard className="p-6" hoverScale={1.02}>
  <h3>Your Content</h3>
</GlassCard>
```

### Glass Button Component
```jsx
<GlassButton 
  icon={<Upload />} 
  text="Upload Image"
  onClick={handleUpload}
/>
```

### Feature Card Component
```jsx
<FeatureCard
  icon={<Sparkles />}
  title="AI Enhancement"
  description="Enhance image quality with AI"
/>
```

## 🔧 Configuration

### Tailwind Configuration
The project uses a standard Tailwind setup with custom animations:

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Custom theme extensions
    }
  },
  plugins: [],
}
```

### Environment Variables
Create a `.env` file for API configurations:
```
REACT_APP_API_URL=your_api_endpoint
REACT_APP_API_KEY=your_api_key
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow React best practices and hooks patterns
- Use Tailwind utility classes for styling
- Maintain the glass morphism design language
- Write clean, commented code
- Test on multiple devices and browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- Lucide for beautiful open-source icons
- The open-source community for inspiration

## 📞 Contact

- **GitHub**: [@sharvinzlife](https://github.com/sharvinzlife)
- **Project Link**: [https://github.com/sharvinzlife/imagecraft-pro](https://github.com/sharvinzlife/imagecraft-pro)

---

<p align="center">Made with ❤️ by Sharvin</p>