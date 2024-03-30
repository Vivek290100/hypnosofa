const mongoose = require('mongoose');
const User=require('../models/userModel')

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;