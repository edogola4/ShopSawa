# ShopSawa Backend

![ShopSawa Logo](https://via.placeholder.com/150x50?text=ShopSawa)  
A robust, scalable e-commerce backend built with Node.js, Express, and MongoDB.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Super Admin, Customer)
  - Password reset functionality

- **Product Management**
  - CRUD operations for products
  - Image upload with Multer
  - Product variants and inventory tracking
  - Category management

- **Order Processing**
  - Shopping cart functionality
  - Order creation and management
  - Payment integration (M-Pesa)
  - Order status tracking

- **Admin Dashboard**
  - Real-time analytics
  - User management
  - Product inventory management
  - Sales reporting

- **API Features**
  - RESTful API design
  - Rate limiting
  - Request validation
  - Comprehensive error handling

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ShopSawa.git
   cd ShopSawa/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Access the API at `http://localhost:5001`

## API Documentation

### Base URL
```
http://localhost:5001/api/v1
```

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/forgot-password` - Request password reset
- `PATCH /api/v1/auth/reset-password/:token` - Reset password

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Admin only)
- `PATCH /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create category (Admin only)

### Orders
- `GET /api/v1/orders` - Get user's orders (or all orders for admin)
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/:id` - Get order details

### Cart
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart` - Add item to cart
- `PATCH /api/v1/cart` - Update cart item
- `DELETE /api/v1/cart` - Clear cart

## Environment Variables

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/shopsawa
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
EMAIL_USERNAME=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
CLIENT_URL=http://localhost:3000
```

## Development

### Running Tests
```bash
npm test
# or
yarn test
```

### Linting
```bash
npm run lint
# or
yarn lint
```

### Building for Production
```bash
npm run build
# or
yarn build
```

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - your.email@example.com

Project Link: [https://github.com/yourusername/ShopSawa](https://github.com/yourusername/ShopSawa)