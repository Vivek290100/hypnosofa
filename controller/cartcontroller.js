const cartModels = require('../models/cartModel');
const mongoose = require('mongoose');
const Product = require('../models/productModel');

//add to cart------------------------------------------------------->
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product || product.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product not available for purchase.' });
    }
    let cart = await cartModels.findOne({ userId });
    if (!cart) {
      cart = new cartModels({ userId, products: [] });
    }
    const existingProduct = cart.products.find(product => product.productId && product.productId.toString() === productId);
    if (existingProduct) {
      await product.save();
    } else {
     
      cart.products.push({ productId});
      await product.save();
    }
    await cart.save();
    res.redirect(`/user/mainproduct/${product._id}`);
    
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// usercart-----------------------------------------
const usercart = async (req, res) => {
  try {
      const user = req.session.user || {};
      const cart = await cartModels.findOne({ userId: user._id }).populate('products.productId', 'name price description images');
      if (!cart) {
          const newCart = new cartModels({ userId: user._id, products: [] });
          await newCart.save();
          return res.redirect('/user/cart');
      }
      const cartItems = cart.products || [];
      let totalPrice = 0;
      cartItems.forEach(item => {
          if (item.productId) {
              if (Array.isArray(item.productId)) {
                  item.productId.forEach(product => {
                      if (product && product._id) {
                          product._id
                          product.name
                          product.images
                          product.quantity
                           product.price
                          
                      } else {
                          console.log('Product ID not available');
                      }
                  });
              } else {
                  item.productId._id
                  item.productId.name
                  item.productId.images[0]
                  item.quantity
                  item.productId.price
                  totalPrice += item.productId.price * item.quantity;
                  
              }
          }
      });
      res.render('./cart/cart.ejs', { pageTitle: 'usercart', user, cartItems, messages: req.flash(), totalPrice });
      // console.log('Total Price:', totalPrice); 
  } catch (error) {
      console.error('Error fetching cart items:', error);
      res.status(500).send('Internal Server Error');
  }
}



//remove from the cart------------------------------------------------------->
const removeFromCart = async (req, res) => {
  const userId = req.session.user._id; 
  const productId = req.params.productId;
  try {
    const cart = await cartModels.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    cart.products = cart.products.filter(
      (item) => item.productId && item.productId.toString() !== productId.toString()
    );
    await cart.save();
    const updatedCart = await cartModels.findOne({ userId });
    // const cartItemCount = updatedCart ? updatedCart.products.length : 0;
    res.redirect('/user/cart');
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};







module.exports = {
    addToCart,
    usercart,
    removeFromCart,

  };