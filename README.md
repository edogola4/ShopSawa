# 🛍️ ShopSawa E-commerce Platform

![ShopSawa Logo](https://via.placeholder.com/200x50?text=ShopSawa)  
A full-stack e-commerce solution built with modern web technologies.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### 🛒 Customer Experience
- 📱 Responsive design for all devices
- 🔍 Advanced product search and filtering
- 🛍️ Seamless shopping cart experience
- 💳 Secure checkout with M-Pesa integration
- 📦 Order tracking and history
- ❤️ Wishlist functionality

### 🛠️ Admin Dashboard
- 📊 Real-time analytics and reporting
- 📦 Product and inventory management
- 👥 User and role management
- 📝 Order processing system
- 📈 Sales and performance metrics

### 🚀 Technical Highlights
- ⚡ Blazing fast performance with React 18
- 🔐 Secure authentication with JWT
- 🛡️ Role-based access control
- 📱 PWA support for mobile users
- 🌐 RESTful API architecture
- 🔄 Real-time updates with WebSockets

## 🏗️ Project Structure

```
shopsawa/
├── backend/           # Node.js/Express API server
├── frontend/          # React.js frontend application
├── scripts/           # Utility scripts
├── uploads/           # File uploads (user content)
└── logs/              # Application logs
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB 6.0+
- Git

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/edogola4/ShopSawa.git
cd ShopSawa/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
# In a new terminal
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env to point to your backend

# Start development server
npm start
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Admin Dashboard: http://localhost:3000/admin
- API Documentation: http://localhost:5001/api-docs

## 🛠️ Development

### Available Scripts

#### Backend
```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Generate API documentation
npm run docs:generate
```

#### Frontend
```bash
# Start development server
npm start

# Create production build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 📦 Deployment

### Production Build

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Set environment variables for production in both frontend and backend

3. Start the production server:
   ```bash
   # In backend directory
   npm start
   ```

### Docker Deployment (Recommended)

```bash
# From project root
docker-compose up --build
```

## 🔧 Environment Variables

### Backend (`.env` in backend/)
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/shopsawa
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
```

### Frontend (`.env` in frontend/)
```env
REACT_APP_API_BASE_URL=http://localhost:5001/api/v1
REACT_APP_IMAGE_BASE_URL=http://localhost:5001
REACT_APP_NAME=ShopSawa
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the [GitHub repository](https://github.com/edogola4/ShopSawa/issues).

## 👏 Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built with ❤️ by Bran Don**
