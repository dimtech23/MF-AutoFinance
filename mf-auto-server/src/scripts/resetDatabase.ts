import mongoose from 'mongoose';
import { User } from '../models/User';
import { Invoice } from '../models/Invoice';
import { Client } from '../models/Client';
import { Appointment } from '../models/Appointment';
import { Budget } from '../models/Budget';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // Store admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Cannot proceed with reset.');
    }

    // Delete all collections except users
    await Promise.all([
      Invoice.deleteMany({}),
      Client.deleteMany({}),
      Appointment.deleteMany({}),
      Budget.deleteMany({})
    ]);

    // Delete all non-admin users
    await User.deleteMany({ role: { $ne: 'admin' } });

    console.log('Database reset complete. Admin user preserved.');
    console.log('Admin email:', adminUser.email);

  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the reset
resetDatabase(); 