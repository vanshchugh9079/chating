import mongoose from 'mongoose';

// MongoDB client options
const clientOptions = {
  serverApi: {
    version: '1',
    strict: true,
    },
};

// Database connection function
const dbConnect = async () => {
  try {
    // Connect to MongoDB using the URI from the environment variable
    await mongoose.connect(process.env.URI, clientOptions);
    console.log("tu pagal hai");
    
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw new Error(error);
  }
};
export default dbConnect;
