const cartModels = require('../models/cartModel');
const mongoose = require('mongoose');
const Product = require('../models/productModel');



const usercart = async (req,res) =>{
    try{
    const user = req.session.user || {};
    const cart = await cartModels.findOne({ userId: user._id }).populate('products.productId', 'name price description image quantity Offerprice');
    if (!cart) {
      const newCart = new cartModels({ userId: user._id, products: [], totals: { subtotal: 0, tax: 0, shipping: 0, grandTotal: 0 } });
      await newCart.save();
      return res.redirect('/user/cart');
    }
    res.render('./cart/cart.ejs', { pageTitle: 'usercart', user,   messages: req.flash() });


    }catch(error){
        console.error('Error fetching cart items:', error);
        res.status(500).send('Internal Server Error');
    }
}







module.exports = {
    usercart,

  };