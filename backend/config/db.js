const { MONGODB_URI } = require("./env");
const mongoose = require('mongoose');

async function connectDB(){
    if(MONGODB_URI===''){
        console.warn('MONGODB_URI is empty');
        return;
    }
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('Connected to MongoDb');
    } catch (error) {
        console.error('Error connecting to mongodb',error); 
    }
}

module.exports = connectDB;