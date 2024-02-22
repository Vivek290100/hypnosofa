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

    // cart.totals.subtotal += product.price;
    // cart.totals.totalprice = cart.totals.subtotal;
    

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
    let updatePrice=0

    cartItems.forEach(item => {
      totalPrice += item.productId.price * item.quantity;
    });
    

  

    // console.log('totalprice', totalPrice);

    res.render('./cart/cart.ejs', { pageTitle: 'usercart', user, cartItems, messages: req.flash(), totalPrice,updatePrice });
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
    console.log(productId);
    const quantity = req.body.quantity;

    const cart = await cartModels.findOne({ 'products.productId': productId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    let updatePrice = 0;

    for (const product of cart.products) {
      if (product.productId.toString() === productId) {
        const originalQuantity = product.quantity;

        // Update the product quantity
        product.quantity = quantity;

        // Fetch the product from the database to get its price
        try {
          const productDetails = await Product.findById(product.productId);
          if (productDetails) {
            // Calculate the total price for this item
            updatePrice += productDetails.price * product.quantity;
            console.log(updatePrice);

            // Calculate the difference in quantity
            const quantityDifference = quantity - originalQuantity;

            // Subtract the difference from the product model quantity in the database
            await Product.findByIdAndUpdate(product.productId, { $inc: { quantity: -quantityDifference } });
          }
        } catch (error) {
          console.error("Error updating product quantity:", error);
        }
        product.updateprice = updatePrice;
      }
    }

    // cart.products.updateprice = updatePrice;

    await cart.save();
    res.json({ success: true, message: 'Quantity updated successfully.', updatePrice: updatePrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

    
// total price
const totalprice =  async (req, res) => {
  try {
      // Logic to fetch and calculate the total price
      // console.log("total price",req.body);
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
      // console.log('totalprice' ,totalPrice);
      cart.totals.totalprice = totalPrice;
      await cart.save();

      // Send the total price as a response
      res.json({ success: true, totalPrice: totalPrice });
  } catch (error) {
      console.error('Error fetching total price:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// In your user controller
const getUpdatedPrice = async (req, res) => {
  const productId = req.query.productId;
  console.log( productId);

  try {
      // Find the product by productId
      const product = await Product.findById(productId);

      // Check if the product exists and has a valid price
      if (!product || !product.price) {
          return res.status(400).json({ success: false, message: 'Invalid product or price unavailable.' });
      }

      // Calculate updatedPrice based on product price and quantity
      const updatedPrice = product.price * quantity;

      res.json({ success: true, updatedPrice: updatedPrice });
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