# BetSightly Frontend

This repository contains the frontend code for the BetSightly application, a sports prediction platform.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/ZILLABB/betsightly-frontend.git
   cd betsightly-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   # Edit .env with your API configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Project Structure
```
betsightly-frontend/
├── public/              # Static assets
├── src/                 # Source code
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Available Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run test` - Run tests
- `npm run test:all` - Run all tests (unit, component, e2e, a11y)
- `npm run optimize` - Optimize images and generate PWA icons
- `npm run perf` - Run optimizations and build for production

## API Integration
The frontend communicates with the backend API at the URL specified in the `VITE_API_BASE_URL` environment variable.

## Deployment
The application can be deployed using Docker:

```bash
docker build -t betsightly-frontend .
docker run -p 80:80 -d betsightly-frontend
```

## Environment Variables
- `VITE_API_BASE_URL`: URL of the backend API
- `VITE_FOOTBALL_API_KEY`: API key for Football Data API

## License
This project is proprietary and confidential.
