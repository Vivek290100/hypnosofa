const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletHistorySchema = new Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const WalletHistory = mongoose.model('WalletHistory', walletHistorySchema);

module.exports = WalletHistory;
