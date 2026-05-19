const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('./models/User');
const GameConfig = require('./models/GameConfig');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spinwheel');
    console.log('MongoDB connected for seeding');

    // Clear existing logic if needed
    // await User.deleteMany({});
    // await GameConfig.deleteMany({});

    // Seed Config
    const configCount = await GameConfig.countDocuments();
    if (configCount === 0) {
      await GameConfig.create({
        entryFee: 100,
        winnerPoolPercentage: 80,
        adminPoolPercentage: 10,
        appPoolPercentage: 10
      });
      console.log('GameConfig seeded');
    }

    // Seed Admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        coins: 1000000
      });
      console.log('Admin user seeded (admin / admin123)');
    }

    // Seed test users
    for (let i = 1; i <= 5; i++) {
      const u = `user${i}`;
      const exists = await User.findOne({ username: u });
      if (!exists) {
        const hash = await bcrypt.hash('password123', 10);
        await User.create({
          username: u,
          password: hash,
          role: 'user',
          coins: 1000
        });
        console.log(`Test user ${u} seeded (password123)`);
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
