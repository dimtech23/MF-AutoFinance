import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app'; // assuming your Express app is exported from app.js or index.js

dotenv.config();

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in .env file.');
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Test the Express server', () => {
  it('should respond with a 201 status code on GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(201);
    expect(response.body).toBe("Home GET Request");
  });

});

export default app;