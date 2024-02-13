const cartModels = require('../models/cartModel');
const mongoose = require('mongoose');
const Product = require('../models/productModel');

//add to cart------------------------------------------------------->
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    console.log('producttttt',product);
    if (!product || product.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product not available for purchase.' });
    }
    let cart = await cartModels.findOne({ userId });
    if (!cart) {
      cart = new cartModels({ userId, products: [] });
    }
    const existingProduct = cart.products.find(product => product.productId && product.productId.toString() === productId);
    if (existingProduct) {
      if (product.quantity - 1 < 0) {
        return res.status(400).json({ success: false, message: 'Product out of stock.' });
      }
      existingProduct.quantity++;
      product.quantity--;
      await product.save();
    } else {
      if (product.quantity - 1 < 0) {
        return res.status(400).json({ success: false, message: 'Product out of stock.' });
      }
      cart.products.push({ productId, quantity: 1 });
      product.quantity--;
      await product.save();
    }
    await cart.save();
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// usercart-----------------------------------------
const usercart = async (req, res) => {
  try {
      const user = req.session.user || {};
      console.log('userrr', user);
      const cart = await cartModels.findOne({ userId: user._id }).populate('products.productId', 'name price description images');
      console.log('cartt', cart);
      if (!cart) {
          const newCart = new cartModels({ userId: user._id, products: [] });
          await newCart.save();
          return res.redirect('/user/cart');
      }
      const cartItems = cart.products || [];
      await cart.save();
      cartItems.forEach(item => {
          if (item.productId) {
              if (Array.isArray(item.productId)) {
                  item.productId.forEach(product => {
                      if (product && product._id) {
                          console.log('Product ID:', product._id);
                          console.log('Product name:', product.name);
                          console.log('Product images:', product.images);
                          console.log('Product quantity:', product.quantity);
                          
                      } else {
                          console.log('Product ID not available');
                      }
                  });
              } else {
                  console.log('Product ID:', item.productId._id);
                  console.log('Product name:', item.productId.name);
                  console.log('Product images:', item.productId.images[0]);
                  console.log('Product quantity:', item.quantity);
                  
              }
          }
      });
      res.render('./cart/cart.ejs', { pageTitle: 'usercart', user, cartItems, messages: req.flash() });

  } catch (error) {
      console.error('Error fetching cart items:', error);
      res.status(500).send('Internal Server Error');
  }
}








module.exports = {
    addToCart,
    usercart,

  };