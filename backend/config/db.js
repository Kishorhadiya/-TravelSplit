const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/travelsplit';

  try {
    const db = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${db.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // If Atlas connection fails (e.g. bad auth or network restriction), fallback to local MongoDB in dev
    if (!process.env.VERCEL && mongoUri !== 'mongodb://localhost:27017/travelsplit') {
      try {
        console.log('Attempting local MongoDB fallback...');
        const db = await mongoose.connect('mongodb://localhost:27017/travelsplit');
        isConnected = db.connections[0].readyState === 1;
        console.log(`Local MongoDB Connected: ${db.connection.host}`);
      } catch (localErr) {
        console.error(`Local MongoDB fallback error: ${localErr.message}`);
      }
    }
  }
};

module.exports = connectDB;
