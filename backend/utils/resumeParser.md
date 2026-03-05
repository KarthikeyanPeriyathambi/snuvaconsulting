# Resume Parser Documentation

## Overview
This module handles resume parsing for various file formats (PDF, DOCX, TXT) with robust error handling and fallback mechanisms.

## Key Features

### 1. Multi-format Support
- **PDF files**: Primary parsing with `pdf-parse`, fallbacks to `pdf-lib` and buffer-based extraction
- **DOCX files**: Parsing with `mammoth` library, fallback to buffer-based extraction
- **TXT files**: Direct buffer-to-string conversion
- **Unsupported formats**: Attempts buffer-based text extraction as last resort

### 2. Import Strategy for ES Modules
Due to compatibility issues with `pdf-parse` not providing ES module exports, the module uses CommonJS `require()`:
```javascript
const pdfParse = require('pdf-parse');
```

### 3. Fallback Mechanisms
The parser implements multiple fallback layers:
1. **Primary**: Standard library parsing (pdf-parse for PDF, mammoth for DOCX)
2. **First fallback**: Alternative library (pdf-lib for PDF)
3. **Second fallback**: Buffer-based text extraction
4. **Final fallback**: Return empty string with error logging

### 4. Error Handling
- Comprehensive try-catch blocks at each parsing stage
- Detailed logging for debugging
- Graceful degradation with empty response instead of exceptions
- Text validation to detect binary content vs. readable text

### 5. Data Structure
Returns standardized resume data with:
- `name`: Candidate's name
- `email`: Email address
- `phone`: Phone number
- `skills`: Array of skills
- `education`: Array of educational entries
- `experience`: Array of work experiences
- `projects`: Array of projects
- `resumeUrl`: Cloudinary URL
- `error`: Error message if parsing failed

## Dependencies
- `pdf-parse`: Primary PDF text extraction
- `pdf-lib`: Alternative PDF parsing (optional)
- `mammoth`: DOCX file parsing
- `llmService`: AI-powered resume parsing

## Installation
```bash
npm install pdf-parse pdf-lib mammoth
```

## Usage
```javascript
import resumeParser from './utils/resumeParser.js';

const result = await resumeParser.process(fileBuffer, resumeUrl, mimeType);
```

## Error Handling Best Practices
- Always check for empty results
- Log errors for debugging
- Validate MIME types before processing
- Handle gracefully when text extraction fails