# 🚀 BetSightly Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **Docker**: 20.x or higher (for containerized deployment)
- **Git**: Latest version
- **SSL Certificate**: Required for production

### Environment Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd betsightly-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-api.com/api

# External API Keys
VITE_FOOTBALL_API_KEY=your_football_data_api_key

# Application Configuration
VITE_APP_TITLE=BetSightly
VITE_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
```

### Getting API Keys
1. **Football Data API**
   - Visit: https://www.football-data.org/client/register
   - Register for a free account
   - Copy your API key to `VITE_FOOTBALL_API_KEY`

## 🏗️ Build Process

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Build Verification
```bash
npm run preview
```

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t betsightly-frontend:latest .
```

### Run Container
```bash
docker run -d \
  --name betsightly-frontend \
  -p 80:80 \
  --env-file .env \
  betsightly-frontend:latest
```

### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
      - VITE_FOOTBALL_API_KEY=${VITE_FOOTBALL_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## ☁️ Cloud Deployment

### AWS (Recommended)
1. **S3 + CloudFront**
   ```bash
   # Build the application
   npm run build
   
   # Upload to S3
   aws s3 sync dist/ s3://your-bucket-name --delete
   
   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

2. **ECS with Docker**
   ```bash
   # Build and push to ECR
   docker build -t betsightly-frontend .
   docker tag betsightly-frontend:latest YOUR_ECR_URI:latest
   docker push YOUR_ECR_URI:latest
   ```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy via Netlify CLI
netlify deploy --prod --dir=dist
```

## 🔒 Security Configuration

### SSL/TLS Setup
1. **Obtain SSL Certificate**
   - Use Let's Encrypt for free certificates
   - Or purchase from a trusted CA

2. **Configure HTTPS**
   ```nginx
   server {
       listen 443 ssl http2;
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       # SSL Security
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
       ssl_prefer_server_ciphers off;
       
       # HSTS
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   }
   ```

### Security Headers
All security headers are pre-configured in `nginx.conf`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: Configured for app requirements
- Referrer-Policy: strict-origin-when-cross-origin

## 📊 Monitoring Setup

### Health Checks
- **Endpoint**: `/health`
- **Expected Response**: `200 OK` with "healthy" text

### Performance Monitoring
```javascript
// Web Vitals are automatically tracked
// Check browser console for performance metrics
```

### Error Tracking
```javascript
// Errors are automatically captured
// Configure external service in monitoring.ts
```

## 🔄 CI/CD Pipeline

### GitHub Actions
The project includes a complete CI/CD pipeline:
- Security audits
- Type checking
- Unit tests
- E2E tests
- Build verification
- Automated deployment

### Required Secrets
```bash
# GitHub Repository Secrets
VITE_API_BASE_URL=https://your-api.com/api
VITE_FOOTBALL_API_KEY=your_api_key
SNYK_TOKEN=your_snyk_token (optional)
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Accessibility Tests
```bash
npm run test:a11y
```

### Security Tests
```bash
npm audit
npm run test:security
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **API Connection Issues**
   - Verify `VITE_API_BASE_URL` is correct
   - Check CORS configuration on backend
   - Ensure SSL certificates are valid

3. **Performance Issues**
   - Check bundle size: `npm run build -- --analyze`
   - Verify CDN configuration
   - Monitor Core Web Vitals

4. **Security Warnings**
   - Run security audit: `npm audit`
   - Check CSP violations in browser console
   - Verify all environment variables are set

### Support
- **Documentation**: Check README.md and SECURITY.md
- **Issues**: Create GitHub issue with detailed description
- **Security**: Report to security@betsightly.com

## 📈 Performance Optimization

### Bundle Analysis
```bash
npm run build -- --analyze
```

### Optimization Checklist
- ✅ Code splitting implemented
- ✅ Lazy loading for routes
- ✅ Image optimization
- ✅ Gzip/Brotli compression
- ✅ CDN configuration
- ✅ Caching strategies

## 🔄 Updates and Maintenance

### Regular Tasks
- **Weekly**: Dependency updates (`npm update`)
- **Monthly**: Security audit (`npm audit`)
- **Quarterly**: Performance review
- **Annually**: Security penetration testing

### Update Process
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test thoroughly
npm test
npm run test:e2e

# Deploy
npm run build
```

---

**🎉 Your BetSightly application is now ready for production deployment!**
