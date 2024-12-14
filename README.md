# Music Catalog Valuation Platform

A full-stack web application for analyzing and valuating music catalogs using computer vision, streaming data analysis, and revenue projections.

## 🚀 Features

### Intelligent Document Processing
- Multi-format file upload support (CSV, PDF, PNG, JPG)
- Computer Vision Analysis:
  - Automated earnings statement recognition
  - Statement structure detection
  - Revenue data extraction
  - Platform-specific earning pattern recognition
- OCR with contextual understanding
- Batch processing with status tracking

### File Processing & Analysis
- Drag-and-drop interface
- Real-time processing status
- Automated data extraction from:
  - Streaming platform statements
  - Royalty reports
  - Financial documents
- Intelligent error detection and correction

### Valuation Engine
- Configurable streaming platform rates
  - Spotify rate configuration
  - Apple Music rate configuration
- Multi-year decay rate modeling
  - Year 1-2 decay rate
  - Year 3-4 decay rate
  - Year 5+ decay rate
- Advanced revenue projection calculations
- Machine learning-based trend analysis

### Computer Vision Earnings Analysis
- Automated Statement Recognition:
  - Platform-specific template detection
  - Layout analysis and segmentation
  - Table structure recognition
- Data Extraction Features:
  - Revenue identification
  - Date pattern recognition
  - Platform fee detection
  - Currency conversion handling
- Validation & Quality Control:
  - Confidence scoring
  - Anomaly detection
  - Cross-reference verification
- Historical Pattern Analysis:
  - Trend identification
  - Seasonal variation detection
  - Growth pattern analysis

### Reporting
- Interactive dashboard
- Key metrics display:
  - Total tracks
  - Current annual revenue
  - Total streams
  - Projected value
- Visual data representation:
  - Revenue projection charts
  - Year-over-year comparisons
  - Platform-specific performance metrics
- Detailed breakdown tables
- PDF export functionality
- Computer vision analysis insights

## 🏗 Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: 
  - Custom components built on Radix UI primitives
  - Tailwind CSS for styling
  - Recharts for data visualization
- **File Handling**: React Dropzone for file uploads

### Backend
- **Server**: Express.js with TypeScript
- **Computer Vision Processing**:
  - Tesseract.js for OCR
  - Custom CV algorithms for document analysis
  - Machine learning models for pattern recognition
- **File Processing**: 
  - Multer for file upload handling
  - Custom processing pipeline
- **Database**: 
  - Drizzle ORM
  - Schema validation with Zod
- **Development**: 
  - Vite for development server
  - Integrated HMR (Hot Module Replacement)

### API Endpoints

POST /api/upload
- Handles file uploads (max 50MB per file)
- Initiates CV analysis pipeline
- Returns batch ID for processing tracking

GET /api/processing/:batchId
- Tracks file processing status
- Returns current processing stage and progress
- Includes CV analysis status

POST /api/valuation/config
- Accepts valuation configuration parameters
- Returns valuation ID and initial calculations

GET /api/valuation/:id/report
- Retrieves complete valuation report
- Includes CV analysis results and projections

## 🛠 Setup & Development

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

### Environment Variables

PORT=5000 # Server port
NODE_ENV=development # Environment (development/production)

## 📁 Project Structure

├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/          # Utility functions and types
│   │   ├── pages/        # Route components
│   │   └── App.tsx       # Root component
├── server/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   └── index.ts         # Server entry point
├── db/
│   ├── schema/          # Database schema
│   └── index.ts         # Database configuration

## 🧪 Testing

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

## 🔒 Security
- File size limits (50MB per file)
- File type validation
- Input sanitization
- Rate limiting (TODO)
- Authentication (TODO)

## 🚧 Future Improvements
- [ ] User authentication and authorization
- [ ] Additional streaming platform integrations
- [ ] Enhanced error handling and validation
- [ ] Batch processing optimization
- [ ] Additional export formats
- [ ] Advanced CV model training
- [ ] Multi-currency support
- [ ] Enhanced anomaly detection
- [ ] Historical trend analysis
- [ ] Platform fee optimization suggestions

## 📄 License
MIT License - see LICENSE file for details
