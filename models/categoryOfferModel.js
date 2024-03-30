// models/Offer.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Catagory',
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
     
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
});

const Offer = mongoose.model('categoryOffer', offerSchema);

module.exports = Offer;