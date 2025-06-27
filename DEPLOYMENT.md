# AlgarCatering - Production Deployment Guide

## Overview
AlgarCatering is a full-stack catering management application built with React, Express, and PostgreSQL. This guide covers production deployment strategies.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based
- **UI**: Tailwind CSS + Radix UI

## Prerequisites

### System Requirements
- Node.js 20+ 
- PostgreSQL 16+
- Docker & Docker Compose (recommended)
- SSL certificates (for HTTPS)
- Domain name with DNS configured

### Environment Variables
Copy `.env.production` and configure:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/algarcatering
POSTGRES_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
SESSION_SECRET=your_secure_session_secret

# Application
NODE_ENV=production
PORT=5000

# Optional
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Build and Deploy**
```bash
# Clone repository
git clone <repository-url>
cd AlgarCatering

# Set up environment
cp .env.production .env
# Edit .env with your values

# Deploy with Docker Compose
npm run docker:run
```

2. **SSL Setup**
```bash
# Create SSL directory
mkdir ssl

# Add your SSL certificates
cp your-domain.pem ssl/fullchain.pem
cp your-domain-key.pem ssl/privkey.pem
```

3. **Database Migration**
```bash
# Run migrations
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed
```

### Option 2: Traditional Server Deployment

1. **Server Setup** (Ubuntu/Debian)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx
```

2. **Application Deployment**
```bash
# Clone and setup
git clone <repository-url>
cd AlgarCatering
npm ci --only=production

# Build application
npm run build

# Setup environment
cp .env.production .env
# Edit .env with your database and security settings

# Run database migrations
npm run db:migrate
npm run db:seed

# Create default admin user
node scripts/create-default-user.js
```

3. **Process Management with PM2**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/index.js --name alagar-catering

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

4. **Nginx Configuration**
```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/alagar-catering
sudo ln -s /etc/nginx/sites-available/alagar-catering /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Cloud Platform Deployment

#### Vercel/Netlify (Frontend Only)
For serverless deployment, you'll need to separate frontend and backend.

#### Railway/Render/DigitalOcean App Platform
1. **Connect Repository**
2. **Set Environment Variables**
3. **Configure Build & Start Commands**:
   - Build: `npm run build`
   - Start: `npm run start`

#### AWS/GCP/Azure
Use container services or virtual machines with the Docker setup.

## Database Setup

### PostgreSQL Configuration
```sql
-- Create database
CREATE DATABASE algarcatering;

-- Create user
CREATE USER alagar_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE algarcatering TO alagar_user;
```

### Connection Pooling
For high-traffic deployments, consider:
- PgBouncer for connection pooling
- Read replicas for scaling
- Database monitoring

## Security Checklist

### SSL/TLS
- [ ] Valid SSL certificate installed
- [ ] HTTPS redirect configured
- [ ] HSTS headers enabled

### Environment Security
- [ ] All default secrets changed
- [ ] Environment variables properly set
- [ ] No secrets in code repository

### Application Security
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet.js)
- [ ] Input validation in place

### Database Security
- [ ] Strong database passwords
- [ ] Database firewall configured
- [ ] Regular backups scheduled

## Monitoring and Maintenance

### Logging
- Application logs: `/app/logs/`
- Error logs: `/app/logs/error.log`
- Access logs: Nginx logs

### Health Monitoring
- Health check endpoint: `/api/health`
- Database connection monitoring
- Server resource monitoring

### Backup Strategy
```bash
# Database backup
pg_dump -h localhost -U alagar_user algarcatering > backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U alagar_user algarcatering > backup_$DATE.sql
```

### Updates and Maintenance
```bash
# Application update
git pull origin main
npm ci --only=production
npm run build
pm2 restart alagar-catering

# Database migration
npm run db:migrate
```

## Performance Optimization

### Frontend
- Static asset caching (1 year)
- Gzip compression enabled
- CDN for static assets (optional)

### Backend
- Database query optimization
- Redis caching (optional)
- API response caching

### Database
- Proper indexing
- Connection pooling
- Query optimization

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall settings

2. **JWT Token Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure consistent secret across instances

3. **Permission Errors**
   - Check file permissions
   - Verify user has database access
   - Check Nginx configuration

### Logs Location
- Application: `/app/logs/combined.log`
- Errors: `/app/logs/error.log`
- Nginx: `/var/log/nginx/`
- System: `/var/log/syslog`

## Support and Maintenance

### Regular Tasks
- [ ] Monitor disk space
- [ ] Check application logs
- [ ] Verify backup integrity
- [ ] Update dependencies
- [ ] Review security logs

### Emergency Procedures
1. **Service Down**: Check PM2 status, restart if needed
2. **Database Issues**: Check PostgreSQL logs, verify connections
3. **High Load**: Monitor resources, scale if necessary

## Contact Information
For technical support, refer to the development team or system administrator.
