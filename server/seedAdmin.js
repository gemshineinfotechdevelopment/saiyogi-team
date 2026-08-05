import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const adminEmails = [
      'admin@crackerhub.com',
      'cracker@saiyogi.com',
      process.env.ADMIN_EMAIL
    ].filter(Boolean);

    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcryptjs.hash(password, 10);

    for (const email of adminEmails) {
      const existingAdmin = await User.findOne({ email });
      if (existingAdmin) {
        console.log(`Admin ${email} already exists. Updating password...`);
        existingAdmin.password = hashedPassword;
        existingAdmin.role = 'SUPER ADMIN';
        await existingAdmin.save();
        console.log(`Admin ${email} updated successfully!`);
      } else {
        console.log(`Creating admin user: ${email}...`);
        const newAdmin = new User({
          name: 'Super Admin',
          email,
          password: hashedPassword,
          role: 'SUPER ADMIN',
          isActive: true
        });
        await newAdmin.save();
        console.log(`Admin user ${email} created successfully!`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
