# AlgarCatering - Enterprise Catering Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21+-black.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A comprehensive bilingual (English/Tamil) catering management system designed for professional catering services. Built with modern web technologies and enterprise-grade architecture.

## 🌟 Key Features

### 🍽️ **Menu Management**
- **Multilingual Support**: Full English and Tamil language support
- **Dynamic Menu**: Real-time menu updates with availability management
- **Categorization**: Organized menu with categories and subcategories
- **Customization Options**: Flexible menu item customizations
- **Print-Ready**: Professional PDF generation with Tamil font support

### 👥 **Order Management**
- **Customer Information**: Comprehensive customer data collection
- **Event Planning**: Event date and guest count management
- **Order Tracking**: Complete order lifecycle management
- **Payment Integration**: Flexible payment tracking and history
- **Status Updates**: Real-time order status notifications

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and customer access controls
- **Rate Limiting**: Protection against abuse and attacks
- **Input Validation**: Comprehensive data validation using Zod
- **Security Headers**: Helmet.js for security best practices

### 🌐 **Modern Architecture**
- **Full-Stack TypeScript**: End-to-end type safety
- **React 18**: Modern React with hooks and concurrent features
- **Express.js**: RESTful API with middleware architecture
- **PostgreSQL**: Robust relational database with Prisma ORM
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first responsive interface

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • TypeScript    │◄──►│ • REST API      │◄──►│ • Prisma ORM    │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Migrations    │
│ • React Query   │    │ • Rate Limiting │    │ • ACID Compliance│
│ • i18next       │    │ • Validation    │    │ • Indexing      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │  Infrastructure │
                    │                 │
                    │ • Docker        │
                    │ • Nginx         │
                    │ • SSL/TLS       │
                    │ • Health Checks │
                    └─────────────────┘
```

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** 20+ with npm
- **PostgreSQL** 16+
- **Docker** (optional, for containerized deployment)

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd AlgarCatering

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 2. Database Setup
```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 3. Development
```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### 4. Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🛠️ **Development Guide**

### Project Structure
```
AlgarCatering/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── types/         # TypeScript type definitions
│   │   └── assets/        # Static assets
│   └── index.html         # Entry HTML file
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── auth.ts           # Authentication logic
│   ├── logger.ts         # Logging configuration
│   └── index.ts          # Server entry point
├── shared/                # Shared types and schemas
├── prisma/               # Database schema and migrations
├── public/               # Static assets and locales
├── tests/                # Test suite
└── docs/                 # Documentation
```

### Development Scripts
```bash
# Development
npm run dev              # Start development server
npm run check           # TypeScript type checking

# Database
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Testing & Quality
npm run test            # Run tests
npm run test:coverage   # Run tests with coverage
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Production
npm run build           # Build for production
npm start              # Start production server
```

### Code Quality Standards
- **ESLint**: Enforces coding standards and catches potential issues
- **Prettier**: Ensures consistent code formatting
- **TypeScript**: Provides static type checking
- **Vitest**: Modern testing framework with great DX
- **Conventional Commits**: Standardized commit message format

## 🌐 **Internationalization**

The application supports English and Tamil languages with:
- **Dynamic Language Switching**: Real-time language changes
- **Tamil Font Support**: Optimized fonts for Tamil text rendering
- **Cultural Adaptations**: Localized date/time and currency formats
- **Print Compatibility**: Tamil text support in PDF generation

### Adding New Languages
1. Create translation files in `public/locales/{lang}/`
2. Add language configuration in `client/src/i18n.ts`
3. Update language selector in components

## 🔧 **Configuration**

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/alagar_catering"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret"
SESSION_SECRET="your-session-secret"

# Server
NODE_ENV="development"
PORT=5000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5000"

# Logging
LOG_LEVEL="info"
LOG_FILE_PATH="logs/app.log"
```

## 🐳 **Docker Deployment**

### Development
```bash
# Build and run with Docker Compose
npm run docker:build
npm run docker:run
```

### Production
```bash
# Build production image
docker build -t alagar-catering .

# Run with environment variables
docker run -d \
  --name alagar-catering \
  -p 5000:5000 \
  --env-file .env \
  alagar-catering
```

## 🔍 **API Documentation**

### Authentication Endpoints
```http
POST /api/auth/login      # User login
POST /api/auth/logout     # User logout
GET  /api/auth/me         # Get current user
```

### Menu Management
```http
GET    /api/menu          # Get all menu items
POST   /api/menu          # Create menu item (admin)
PUT    /api/menu/:id      # Update menu item (admin)
DELETE /api/menu/:id      # Delete menu item (admin)
PATCH  /api/menu/:id      # Toggle availability (admin)
```

### Order Management
```http
GET  /api/orders          # Get all orders
POST /api/orders          # Create new order
GET  /api/orders/:id      # Get order details
PUT  /api/orders/:id      # Update order
```

### System Health
```http
GET /api/health           # System health check
```

## 🧪 **Testing Strategy**

### Test Types
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Full user workflow testing
- **Performance Tests**: Load and stress testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- navigation.test.tsx
```

## 📊 **Performance Monitoring**

### Metrics Tracked
- **Response Times**: API endpoint performance
- **Database Queries**: Query execution times
- **Error Rates**: Application error monitoring
- **User Sessions**: Authentication and session tracking

### Health Checks
- **Database Connectivity**: PostgreSQL connection status
- **Memory Usage**: Server memory consumption
- **CPU Usage**: Server CPU utilization
- **Disk Space**: Available storage monitoring

## 🔒 **Security Features**

### Implemented Security Measures
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: SameSite cookie configuration
- **HTTPS Enforcement**: Secure transport layer
- **Security Headers**: Helmet.js middleware

### Security Best Practices
- Regular dependency updates
- Environment variable protection
- Database connection encryption
- Audit logging
- Error message sanitization

## 🚀 **Deployment Guide**

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Health checks working
- [ ] Backup strategy implemented

### Monitoring & Maintenance
- **Log Rotation**: Automated log management
- **Database Backups**: Regular PostgreSQL backups
- **Performance Monitoring**: Application performance tracking
- **Security Updates**: Regular dependency updates
- **Health Monitoring**: Automated health checks

## 🤝 **Contributing**

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Coding Standards
- Follow TypeScript best practices
- Use meaningful variable and function names
- Write comprehensive tests
- Document complex functions
- Follow the existing project structure

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Community**: Join our discussions for questions and support

### Troubleshooting
- **Build Issues**: Check Node.js and npm versions
- **Database Issues**: Verify PostgreSQL connection and credentials
- **Authentication Issues**: Check JWT secret configuration
- **Performance Issues**: Review rate limiting and caching settings

---

**Built with ❤️ for the catering industry**

*AlgarCatering - Professional catering management made simple*
