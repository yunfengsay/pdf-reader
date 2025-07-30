# PDF Reader with AI Assistant

A modern PDF reader application with built-in AI assistant, annotation capabilities, and document management.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F[YOUR_GITHUB_USERNAME]%2Fpdf-reader&env=VITE_XAI_API_KEY,VITE_DASHSCOPE_API_KEY&envDescription=API%20keys%20for%20AI%20providers%20(optional)&project-name=pdf-reader&repository-name=pdf-reader)

## Features

- 📄 **PDF Viewing & Management**
  - Local PDF file support with IndexedDB storage
  - arXiv paper search and download
  - Document library with search and filtering
  - Automatic thumbnail generation

- ✍️ **Annotation Tools**
  - Text highlighting with multiple styles
  - Drawing tools (pen, shapes, arrows)
  - Notes and comments
  - Persistent annotation storage

- 🤖 **AI Assistant**
  - Integrated chat panel with PDF context
  - Support for multiple AI providers (xAI Grok, DashScope)
  - Smart text selection and question asking
  - Markdown rendering with syntax highlighting

- 🎨 **Modern UI**
  - Clean, minimalist design
  - Responsive layout
  - Dark mode support (coming soon)
  - Resizable panels

## Deployment

### One-Click Deploy to Vercel

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Configure environment variables (optional):
   - `VITE_XAI_API_KEY`: For xAI Grok integration
   - `VITE_DASHSCOPE_API_KEY`: For DashScope integration
4. Click "Deploy"

### Manual Deployment

```bash
# Build the project
npm run build

# The 'dist' folder contains the production build
# Upload to any static hosting service
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/[YOUR_GITHUB_USERNAME]/pdf-reader.git
cd pdf-reader

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Provider API Keys (optional)
VITE_XAI_API_KEY=your_xai_api_key
VITE_DASHSCOPE_API_KEY=your_dashscope_api_key
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build Electron app
npm run electron-dev
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **PDF Rendering**: PDF.js
- **State Management**: Zustand
- **Database**: IndexedDB (via Dexie)
- **AI Integration**: Vercel AI SDK
- **Build Tool**: Vite
- **Desktop**: Electron (optional)

## Project Structure

```
pdf-reader/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── stores/        # Zustand stores
│   ├── models/        # TypeScript models
│   ├── utils/         # Utility functions
│   └── styles/        # CSS files
├── electron/          # Electron main process
└── public/           # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://zustand-demo.pmnd.rs/) for state management