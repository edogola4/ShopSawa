# 🛒 ShopSawa E-commerce Frontend

A modern, secure, and responsive e-commerce storefront built with React.js and Tailwind CSS, designed to work seamlessly with the ShopSawa Node.js backend.

## ✨ Features

### 🛍️ **Customer Experience**
- 📱 **Responsive Design** - Mobile-first approach with seamless desktop experience
- 🔍 **Advanced Search** - Real-time product search with debounced queries
- 🏷️ **Smart Filtering** - Filter by category, price range, ratings, and availability
- 🛒 **Intelligent Cart** - Persistent cart with guest and authenticated user support
- ❤️ **Wishlist** - Save favorite products for later
- 📦 **Order Tracking** - Real-time order status updates
- 💳 **Secure Checkout** - M-Pesa integration with secure payment processing

### 🔒 **Security & Performance**
- 🛡️ **Security First** - XSS prevention, input validation, secure token handling
- ⚡ **Optimized Performance** - Code splitting, lazy loading, memoization
- 🔄 **Offline Support** - Service worker integration for offline functionality
- 📊 **Error Tracking** - Comprehensive error handling and user feedback

### 🎨 **Modern UI/UX**
- 🌙 **Dark Mode** - System preference detection with manual toggle
- 🎯 **Accessibility** - WCAG 2.1 AA compliant
- 🔄 **Real-time Updates** - Live cart updates and notifications
- 📱 **PWA Ready** - Progressive Web App capabilities

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure you have Node.js installed (v18 or higher)
node --version  # Should be v18+
npm --version   # Should be v8+
```

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/shopsawa-frontend.git
cd shopsawa-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm start
```

### Environment Variables
Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5001/api/v1
REACT_APP_IMAGE_BASE_URL=http://localhost:5001

# App Configuration
REACT_APP_NAME=ShopSawa
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Features
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DARK_MODE=true

# M-Pesa Configuration (Optional - handled by backend)
REACT_APP_MPESA_PAYBILL=174379
```

## 🏗️ Architecture

### **Folder Structure**
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components (routes)
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── context/            # React Context providers
├── utils/              # Utility functions
└── styles/             # CSS and styling
```

### **Key Architectural Decisions**

#### 🔒 **Security-First Design**
- **Input Sanitization**: All user inputs are validated and sanitized
- **XSS Prevention**: Content is properly escaped and sanitized
- **Secure Storage**: Tokens stored securely with httpOnly cookies when possible
- **CSRF Protection**: Cross-site request forgery protection implemented
- **Rate Limiting**: Client-side rate limiting to prevent abuse

#### 🔄 **DRY (Don't Repeat Yourself) Principle**
- **Reusable Components**: Common UI elements abstracted into reusable components
- **Custom Hooks**: Shared logic extracted into custom hooks
- **Service Layer**: Centralized API communication
- **Utility Functions**: Common operations centralized in utility modules

#### ⚡ **Performance Optimization**
- **Code Splitting**: Route-based and component-based code splitting
- **Lazy Loading**: Images and components loaded on demand
- **Memoization**: Expensive calculations and components memoized
- **Bundle Optimization**: Tree shaking and dead code elimination

## 🛠️ Development

### **Available Scripts**

```bash
# Development
npm start                 # Start development server
npm run dev              # Start with detailed logging

# Building
npm run build            # Build for production
npm run build:analyze    # Build with bundle analyzer

# Testing
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run test:watch       # Run tests in watch mode

# Linting & Formatting
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# Deployment
npm run deploy           # Deploy to production
npm run deploy:staging   # Deploy to staging
```

### **Code Quality Standards**

#### **ESLint Configuration**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'prettier'
  ],
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

#### **Prettier Configuration**
```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 🔧 Configuration

### **Tailwind CSS Setup**
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
};
```

### **API Integration**
```javascript
// Backend endpoints used:
const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/signup',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_TREE: '/categories/tree',
  
  // Cart
  CART: '/cart',
  CART_ITEMS: '/cart/items',
  
  // Orders
  ORDERS: '/orders',
  MY_ORDERS: '/orders/my-orders'
};
```

## 🔐 Security Considerations

### **Data Protection**
- All sensitive data encrypted in transit (HTTPS)
- User tokens stored securely with appropriate expiration
- Input validation on all forms
- Content Security Policy (CSP) headers implemented

### **Authentication Flow**
1. User credentials sent securely to backend
2. JWT token received and stored in httpOnly cookie
3. Token included in API requests via Authorization header
4. Automatic token refresh before expiration
5. Secure logout with token invalidation

### **XSS Prevention**
- All user-generated content properly escaped
- dangerouslySetInnerHTML avoided unless absolutely necessary
- Content Security Policy prevents inline scripts
- Input sanitization for all form fields

## 📱 Responsive Design

### **Breakpoints**
```css
/* Tailwind CSS breakpoints used */
sm: '640px',   /* Small devices */
md: '768px',   /* Medium devices */
lg: '1024px',  /* Large devices */
xl: '1280px',  /* Extra large devices */
2xl: '1536px'  /* 2X Extra large devices */
```

### **Mobile-First Approach**
- Base styles designed for mobile devices
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Optimized performance for mobile networks

## 🚀 Deployment

### **Production Build**
```bash
# Create optimized production build
npm run build

# Serve build locally for testing
npx serve -s build
```

### **Environment-Specific Configurations**
```bash
# Development
REACT_APP_API_BASE_URL=http://localhost:5001/api/v1

# Staging
REACT_APP_API_BASE_URL=https://staging-api.shopsawa.com/api/v1

# Production
REACT_APP_API_BASE_URL=https://api.shopsawa.com/api/v1
```

### **Deployment Checklist**
- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active

## 🤝 Contributing

### **Development Workflow**
1. Create feature branch from `develop`
2. Implement changes following coding standards
3. Add/update tests as needed
4. Run linting and formatting
5. Submit pull request with detailed description

### **Commit Message Convention**
```
type(scope): description

feat(auth): add social login functionality
fix(cart): resolve quantity update issue
docs(readme): update installation instructions
style(product): improve product card styling
```

## 📞 Support

### **Backend Integration**
This frontend is designed to work with your existing ShopSawa backend:
- **API Base URL**: `http://localhost:5001/api/v1`
- **Authentication**: JWT token-based
- **File Uploads**: Supports Cloudinary integration
- **Payments**: M-Pesa integration ready

### **Common Issues**
1. **CORS Issues**: Ensure backend CORS is configured for frontend URL
2. **API Connectivity**: Verify backend is running on correct port
3. **Image Loading**: Check image upload path configuration

### **Getting Help**
- Check the [issues](https://github.com/your-username/shopsawa-frontend/issues) page
- Review the [backend documentation](https://github.com/your-username/shopsawa-backend)
- Contact: edogola4@gmail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for ShopSawa E-commerce Platform**

Your Name - Bran Don
