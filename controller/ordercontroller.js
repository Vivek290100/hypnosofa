const orderModels = require('../models/orderModel');
const cartModels = require('../models/cartModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const moment = require('moment');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');



const checkout = async (req, res) => {
    try {
        const user = req.session.user;
        const addresses = await Address.find();
        const cart = await cartModels.findOne({ userId: user._id });
        const cartItems = cart ? cart.products : [];

        let totalPrice = 0;

        for (const item of cartItems) {
            try {
                const product = await Product.findById(item.productId);
                
                // Check if the product exists and has a price
                if (product && product.price) {
                    totalPrice += product.price * item.quantity;
                } else {
                    console.log('Product ID or price not available');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }

        

        res.render('./orders/checkout', { addresses, user, cartItems, totalPrice });
    } catch (error) {
        console.error('Error fetching user addresses and cart data for checkout:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

}

//order time------------------------------------------------------->
function getCurrentTime() {
    return moment().format('hh:mm A');
}


//-----create orderdatabase----------------------------------------
const createOrder = async (req, res, addresses) => {
    try {
        // console.log("Request Body:", req.body);
        const orderTime = getCurrentTime();
        const currentDate = moment();
        const orderDate = currentDate.format('DD-MM-YYYY');
        const userId = req.session.user._id;
        const { addressIndex, paymentMethod } = req.body;

        // console.log("Received data - userId:", userId, "addressIndex:", addressIndex, "paymentMethod:", paymentMethod);

        const cart = await cartModels.findOne({ userId: userId });
        const cartItems = cart ? cart.products : [];

        const products = cart.products.map(cartItem => ({
            product: cartItem.productId,
            name: cartItem.name,
            quantity: cartItem.quantity,
        }));

        console.log("productsss",products);

        let totalPrice = 0;
        for (const item of cartItems) {
            try {
                const product = await Product.findById(item.productId);

                if (product && product.price) {
                    totalPrice += product.price * item.quantity;
                } else {
                    console.log('Product ID or price not available');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }

        // Create the order
        const newOrderId = new ObjectId().toString(); 
        const newOrder = new orderModels({
            orderID: newOrderId,
            customer: userId,
            products: cartItems.map(item => ({ product: item.productId, quantity: item.quantity })),
            address: addresses[addressIndex],
            totals: {
                subtotal: totalPrice,
                totalprice: totalPrice,
            },
            orderDate: orderDate,
            orderTime: orderTime

        });
        // console.log('neworderrrr', newOrder);
        await cartModels.findOneAndDelete({ userId: userId });

        await newOrder.save();

        
        // res.status(201).json({ success: true, message: 'Order created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};



//successorder---------------------------------------------------->
const successorder = async (req, res) => {
    try {
        const user = req.session.user;
  
        res.render("./orders/successorder", { pageTitle: "confirm", user});
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

//user orders-------------------------------------------->  
const userorders = async (req,res)=>{
    try{
        const user = req.session.user;
        const userId = req.session.user._id;
        console.log('user',user);
        console.log('userId',userId);


        const Orders = await orderModels.find({ customer: userId }).populate('products.product');
        console.log('ordersss',Orders);


        res.render('./orders/userorders', { user: req.session.user, Orders });
    } catch (error){
        console.error('Error fetching user orders:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


const viewproduct = async (req,res)=>{
    try{
        const user = req.session.user;


        res.render('./orders/viewproduct',{user})
    }catch(error){
        console.error('Error fetching user orders:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}














//modules------------------------------------------------------->
module.exports={
    checkout,
    createOrder,
    successorder,
    userorders,
    viewproduct
} 