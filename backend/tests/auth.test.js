const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '254700000000',
        password: 'password123',
        passwordConfirm: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('registered successfully');
    });

    it('should not register user with invalid data', async () => {
      const userData = {
        firstName: 'John',
        email: 'invalid-email',
        password: '123'
      };

      await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '254700000000',
        password: 'password123',
        isVerified: true
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe('john@example.com');
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);
    });
  });
});