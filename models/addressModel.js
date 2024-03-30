const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  mobile: { type: String },
  email: { type: String },
  pincode: { type: String },
  houseName: { type: String },
  locality: { type: String },
  city: { type: String },
  district: { type: String },
  state: { type: String },
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;