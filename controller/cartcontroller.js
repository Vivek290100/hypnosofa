const cartModels = require('../models/cartModel');
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const ProductOffer = require("../models/productOfferModel");


const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    let cart = await cartModels.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, products: [] } },
      { upsert: true, new: true }
    );

    let discountedPrice = product.price;
    const activeOffer = await ProductOffer.findOne({ product: productId });
    if (activeOffer && isActiveOffer(activeOffer)) {
      const discountPercentage = activeOffer.discountPercentage;
      const discountAmount = (product.price * discountPercentage) / 100;
      discountedPrice = product.price - discountAmount;
    }

    const existingProductIndex = cart.products.findIndex(item => item.productId && item.productId.toString() === productId);
    if (existingProductIndex !== -1) {
      cart.products[existingProductIndex].quantity++;
    } else {
      cart.products.push({ productId, quantity: 1, price: discountedPrice }); 
    }

    await cart.save();
    res.redirect(`/user/mainproduct/${product._id}`);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const usercart = async (req, res) => {
  try {
    const user = req.session.user || {};
    let cart = await cartModels.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, products: [] } },
      { upsert: true, new: true }
    ).populate('products.productId', 'name price description images quantity');

    const cartItems = cart.products || [];
    let totalPrice = 0;
    let updatePrice=0

    cartItems.forEach(item => {
      totalPrice += item.productId.price * item.quantity;
    });
    res.render('./cart/cart.ejs', { pageTitle: 'usercart', user, cartItems, messages: req.flash(), totalPrice,updatePrice });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).send('Internal Server Error');
  }
};



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
    res.redirect('/user/cart');
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.productId;
        const newQuantity = parseInt(req.body.quantity);

        if (isNaN(newQuantity) || newQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const cart = await cartModels.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.products.findIndex(
            item => item.productId.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not in cart' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (newQuantity > product.quantity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available',
                available: product.quantity || 0
            });
        }

        const oldQuantity = cart.products[itemIndex].quantity;
        cart.products[itemIndex].quantity = newQuantity;

        let newSubtotal = 0;
        let thisItemSubtotal = 0;

        for (const item of cart.products) {
            const prod = await Product.findById(item.productId);
            if (!prod) continue;

            let effectivePrice = prod.price;

            const offer = await ProductOffer.findOne({ product: item.productId });
            if (offer && isActiveOffer(offer)) {
                const discount = (prod.price * offer.discountPercentage) / 100;
                effectivePrice -= discount;
            }

            const itemTotal = effectivePrice * item.quantity;
            newSubtotal += itemTotal;

            if (item.productId.toString() === productId) {
                thisItemSubtotal = itemTotal;
            }
        }

        if (!cart.totals) cart.totals = {};
        cart.totals.subtotal = newSubtotal;
        await cart.save();

        res.json({
            success: true,
            newQuantity,
            itemSubtotal: thisItemSubtotal.toFixed(2),
            cartSubtotal: newSubtotal.toFixed(2),
            message: 'Quantity updated successfully'
        });

    } catch (error) {
        console.error('Error in updateQuantity:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


function isActiveOffer(offer) {
  const today = new Date();
  return today >= offer.startDate && today <= offer.expiryDate;
}


    
const totalprice = async (req, res) => {
  try {
    const user = req.session.user;
    const cart = await cartModels.findOne({ userId: user._id });
    const cartItems = cart ? cart.products : [];
    let totalPrice = 100;

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (product && product.price) {
        let productPrice = product.price;
        const activeOffer = await ProductOffer.findOne({ product: item.productId });
        if (activeOffer && isActiveOffer(activeOffer)) {
          const discountPercentage = activeOffer.discountPercentage;
          const discountAmount = (product.price * discountPercentage) / 100;
          productPrice -= discountAmount;
        }
        totalPrice += productPrice * item.quantity;
      }
    }
    cart.totals.totalprice = totalPrice;
    await cart.save();
    res.json({ success: true, totalPrice: totalPrice });
  } catch (error) {
    console.error('Error fetching total price:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

function isActiveOffer(offer) {
  const today = new Date();
  return today >= offer.startDate && today <= offer.expiryDate;
}



const getUpdatedPrice = async (req, res) => {
  const productId = req.query.productId;
  try {
      const product = await Product.findById(productId);
      if (!product || !product.price) {
          return res.status(400).json({ success: false, message: 'Invalid product or price unavailable.' });
      }
      const cart = await cartModels.findOne({ userId: req.session.user._id });
      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found' });
      }
      let updatePrice = 0;
      for (const item of cart.products) {
          if (item.productId.toString() === productId) {
              updatePrice = item.price*item.quantity
          }
      }
      cart.totals.subtotal = updatePrice 
      await cart.save();
      res.render('./cart/cart.ejs', { pageTitle: 'usercart', user, cartItems, messages: req.flash(), totalPrice, updatePrice });
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
