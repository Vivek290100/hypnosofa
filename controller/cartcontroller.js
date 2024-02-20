const cartModels = require('../models/cartModel');
const mongoose = require('mongoose');
const Product = require('../models/productModel');

//addToCart function
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product || product.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product not available for purchase.' });
    }
    let cart = await cartModels.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, products: [] } },
      { upsert: true, new: true }
    );

    const existingProductIndex = cart.products.findIndex(item => item.productId && item.productId.toString() === productId);
    if (existingProductIndex !== -1) {
      cart.products[existingProductIndex].quantity++;
    } else {
      cart.products.push({ productId, quantity: 1 });
    }

    await cart.save();
    res.redirect(`/user/mainproduct/${product._id}`);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

//usercart function
const usercart = async (req, res) => {
  try {
    const user = req.session.user || {};
    let cart = await cartModels.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, products: [] } },
      { upsert: true, new: true }
    ).populate('products.productId', 'name price description images');

    const cartItems = cart.products || [];
    let totalPrice = 0;

    cartItems.forEach(item => {
      totalPrice += item.productId.price * item.quantity;
    });

    res.render('./cart/cart.ejs', { pageTitle: 'usercart', user, cartItems, messages: req.flash(), totalPrice });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).send('Internal Server Error');
  }
};



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



//updateQuantity function
const updateQuantity = async (req, res) => {
  try {
    const productId = req.params.productId;
    const quantity = req.body.quantity;

    const cart = await cartModels.findOne({ 'products.productId': productId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    

    for (const product of cart.products) {
      if (product.productId.toString() === productId) {
        // Save the original quantity before updating
        const originalQuantity = product.quantity;

        // Update the product quantity
        product.quantity = quantity;

        // Calculate the difference in quantity
        const quantityDifference = quantity - originalQuantity;

        // Subtract the difference from the product model quantity in the database
        try {
          await Product.findByIdAndUpdate(product.productId, { $inc: { quantity: -quantityDifference } });
          // console.log("Subtracted quantity from model:", quantityDifference);
        } catch (error) {
          console.error("Error updating product quantity:", error);
        }
      }
    }

    let totalPrice = 0;
    cart.products.forEach(item => {
      totalPrice += item.productId.price * item.quantity;
    });

    await cart.save();
    res.json({ success: true, message: 'Quantity updated successfully.', totalPrice: totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

    
// total price
const totalprice =  async (req, res) => {
  try {
      // Logic to fetch and calculate the total price
      const user = req.session.user;
      const cart = await cartModels.findOne({ userId: user._id });
      const cartItems = cart ? cart.products : [];
      let totalPrice = 0;

      for (const item of cartItems) {
          const product = await Product.findById(item.productId);
          if (product && product.price) {
              totalPrice += product.price * item.quantity;
          }
      }

      // Send the total price as a response
      res.json({ success: true, totalPrice: totalPrice });
  } catch (error) {
      console.error('Error fetching total price:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const getUpdatedPrice = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.query;

  try {
      // Fetch the product from the database
      const product = await Product.findById(productId);
      console.log("product",product);

      // Calculate the updated price based on the provided quantity
      const updatedPrice = product.price * parseInt(quantity);
      console.log("updatedPriceee",updatedPrice);

      // Send the updated price in the response
      res.json({ success: true, updatedPrice: updatedPrice, cartItems: cartItems });
  } catch (error) {
      console.error('Error updating price based on quantity:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};








module.exports = {
    addToCart,
    usercart,
    removeFromCart,
    updateQuantity,
    totalprice,
    getUpdatedPrice


  };