// models/Order.js
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require('../models/productModel');

const orderSchema = new mongoose.Schema({
  orderID: {
    type: String,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  address: {
    houseName: {
      type: String,
    },
    locality: {
      type: String,
    },
    city: {
      type: String,
    },
    district: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
  },
  totals: {
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required:true,
    },
    shipping: {
      type: Number,
      required:true,
    },
    grandTotal: {
      type: Number,
      required:true,
    },
  },
  orderDate: {
    type: Date,
    required: true,
  },
  orderTime: {
    type: String, 
    required: true,
  },
  deliveryDate: {
    type: Date,
    required:true,
  },
  deliveryTime: {
    type: String,
    required:true 
  },
  couponCode:{
    type:String,
  },
  discountAmount:{
    type:String,
  },

  paymentMethod: {
    type: String,
    enum: ['Wallet', 'RazorPay', 'Cash on Delivery', 'Other'], 
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
