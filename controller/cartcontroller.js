const cartModels = require('../models/cartModel');
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const ProductOffer = require("../models/productofferModel");


//addToCart function
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    // if (!product || product.quantity <= 0) {
    //   return res.status(400).json({ success: false, message: 'Product not available for purchase.' });
    // }

    let cart = await cartModels.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, products: [] } },
      { upsert: true, new: true }
    );

    // Calculate the discounted price if there's an active offer
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
      cart.products.push({ productId, quantity: 1, price: discountedPrice }); // Store the discounted price in the cart
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
    let updatePrice=0

    cartItems.forEach(item => {
      totalPrice += item.productId.price * item.quantity;
    });


    // Extract product IDs
    const productIds = cartItems.map(item => item.productId._id);
    console.log('Product IDs:', productIds);

    // Query the database to get quantities
    const productQuantities = await Product.find({ _id: { $in: productIds } }, { _id: 1, quantity: 1 });
    console.log('Product Quantities:', productQuantities);



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
    const quantity = req.body.quantity;

    if (quantity==10) {
      console.log('limit reached',);//====================
      // return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
    }

    const cart = await cartModels.findOne({ 'products.productId': productId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    
    const productIds = cart.products.map(item => item.productId._id);

    const productOffers = await ProductOffer.find({ product: { $in: productIds } });

    // console.log('productOffers', productOffers);

    let updatePrice = 0;

    for (const product of cart.products) {
      if (product.productId.toString() === productId) {
        const originalQuantity = product.quantity;

        
        // console.log('quantityquantity',quantity);
        if (quantity > 0 && quantity<=10) {
          // console.log('Updating quantity for product:', product);

          product.quantity = quantity;
          

          
          const productDetails = await Product.findById(product.productId);
          if (productDetails) {
            let discountedPrice = productDetails.price;
            // Check if there's an active offer for this product
            const activeOffer = productOffers.find(offer => offer.product.toString() === product.productId.toString());
            if (activeOffer && isActiveOffer(activeOffer)) {
              const discountPercentage = activeOffer.discountPercentage;
              const discountAmount = (productDetails.price * discountPercentage) / 100;
              discountedPrice = productDetails.price - discountAmount;
            }
            updatePrice += discountedPrice * product.quantity;

            const quantityDifference = quantity - originalQuantity;

            await Product.findByIdAndUpdate(product.productId, { $inc: { quantity: -quantityDifference } });
          }
          
          product.updateprice = updatePrice;
          // console.log('Updated product:', product);


        }
        //else if(quantity==10){
        //   console.log('Max quantity reached .' );
        //   return res.status(400).json({ success: false, message: 'Max quantity reached .' });

        // }
      }
    }

    let subtotal = 0;
    cart.products.forEach(item => {
      subtotal += item.updateprice || (item.productId.price * item.quantity);
    });
    cart.totals.subtotal = subtotal;
    // console.log('Updated cart:', cart);



    await cart.save();
    // console.log('Cart saved successfully.');

    res.json({ success: true, message: 'Quantity updated successfully.', updatePrice: updatePrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};




// ------------------------------------------------
function isActiveOffer(offer) {
  const today = new Date();
  return today >= offer.startDate && today <= offer.expiryDate;
}



    
// total price----------------------------------------
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
        // Check if there's an active offer for this product
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

// Function to check if offer is active
function isActiveOffer(offer) {
  const today = new Date();
  return today >= offer.startDate && today <= offer.expiryDate;
}







// ---------------------------------------------------
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
              updatePrice = item.updateprice || item.productId.price;
              break;
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