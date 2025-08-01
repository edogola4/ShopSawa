// backend/src/config/swagger.js

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce Platform API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce platform API with M-Pesa integration',
      contact: {
        name: 'API Support',
        email: 'support@yourdomain.com',
        url: 'https://yourdomain.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64f7b1234567890123456789',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            phone: {
              type: 'string',
              example: '254700000000',
            },
            role: {
              type: 'string',
              enum: ['customer', 'admin', 'super_admin'],
              example: 'customer',
            },
            isVerified: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64f7b1234567890123456789',
            },
            name: {
              type: 'string',
              example: 'iPhone 15 Pro',
            },
            slug: {
              type: 'string',
              example: 'iphone-15-pro',
            },
            description: {
              type: 'string',
              example: 'Latest iPhone with advanced features',
            },
            price: {
              type: 'number',
              example: 150000,
            },
            category: {
              type: 'string',
              example: '64f7b1234567890123456789',
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
                  },
                  alt: {
                    type: 'string',
                    example: 'iPhone 15 Pro',
                  },
                },
              },
            },
            inventory: {
              type: 'object',
              properties: {
                quantity: {
                  type: 'number',
                  example: 50,
                },
                trackQuantity: {
                  type: 'boolean',
                  example: true,
                },
              },
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'archived'],
              example: 'active',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64f7b1234567890123456789',
            },
            orderNumber: {
              type: 'string',
              example: 'ORD1698765432101',
            },
            customer: {
              $ref: '#/components/schemas/User',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: {
                    type: 'string',
                    example: '64f7b1234567890123456789',
                  },
                  name: {
                    type: 'string',
                    example: 'iPhone 15 Pro',
                  },
                  price: {
                    type: 'number',
                    example: 150000,
                  },
                  quantity: {
                    type: 'number',
                    example: 1,
                  },
                  total: {
                    type: 'number',
                    example: 150000,
                  },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                subtotal: {
                  type: 'number',
                  example: 150000,
                },
                shipping: {
                  type: 'number',
                  example: 0,
                },
                tax: {
                  type: 'number',
                  example: 24000,
                },
                total: {
                  type: 'number',
                  example: 174000,
                },
              },
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'pending',
            },
            payment: {
              type: 'object',
              properties: {
                method: {
                  type: 'string',
                  enum: ['mpesa', 'card', 'cod'],
                  example: 'mpesa',
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'paid', 'failed'],
                  example: 'pending',
                },
              },
            },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64f7b1234567890123456789',
            },
            order: {
              type: 'string',
              example: '64f7b1234567890123456789',
            },
            amount: {
              type: 'number',
              example: 174000,
            },
            method: {
              type: 'string',
              enum: ['mpesa', 'card', 'bank_transfer'],
              example: 'mpesa',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              example: 'pending',
            },
            mpesaReceiptNumber: {
              type: 'string',
              example: 'QEL1234567',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/**/*.js',
    './src/models/*.js',
  ],
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'E-commerce API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  }));
};

module.exports = {
  swaggerSetup,
  specs,
};