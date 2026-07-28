import mongoose from "mongoose";
import { env } from './env.js';
const connectMongoDB = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log(`Connected to ${mongoose.connection.name} database`)
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});

export default connectMongoDB;