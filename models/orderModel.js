const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
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
    totalprice: {
      type: Number,
      required:true,
    },
    discountTotal:{
      type:Number,
    },
    couponCode:{
      type:String,
    },
    discountAmount:{
      type:Number,
    },
  },
  orderDate: {
    type: String,
    required: true,
  },
  orderTime: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Failed'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    enum: ['Wallet', 'RazorPay', 'Cash On Delivery'], 
    required: true,
  },
 
 
 

  
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
