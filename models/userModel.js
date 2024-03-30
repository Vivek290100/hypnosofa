const mongoose = require("mongoose");
require('dotenv').config();
// const Address = require('../models/addressModel');

mongoose.connect(process.env.MONGODB_URI || " mongodb://127.0.0.1:27017/hypno")


// , {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })


    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
    });

    const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'blocked'], 
            default: 'active' 
        },
        referralCode: {
            type: String,
            unique: true 
        },
    });
    
    const User = mongoose.model('User', userSchema);
    
    module.exports = User;

