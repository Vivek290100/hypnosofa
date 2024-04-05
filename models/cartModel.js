const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId },
  products: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      price: {type: Number},
      updateprice: {type: Number},
    },
  ],
  totals: {
    total:{type: Number, default: 0}, 
    subtotal: {type: Number,default: 0},
    totalprice: { type: Number, default: 0 },
  },
});


const  cartModels= mongoose.model('Cart', cartSchema);

module.exports =  cartModels;
