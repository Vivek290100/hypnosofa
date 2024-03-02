const orderModels = require('../models/orderModel');
const cartModels = require('../models/cartModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const moment = require('moment');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
const Razorpay = require('razorpay');


    instance = new Razorpay({
    key_id: 'rzp_test_Dc1MSlNThSEKkf',
    key_secret: 'ojehzUEvc0lwVxNXI57xnRPj',
  });


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
        const orderTime = getCurrentTime();
        const currentDate = moment();
        const orderDate = currentDate.format('DD-MM-YYYY');
        const userId = req.session.user._id;
        const { addressIndex, paymentMethod } = req.body;
        const cart = await cartModels.findOne({ userId: userId });
        const cartItems = cart ? cart.products : [];

        const products = cart.products.map(cartItem => ({
            product: cartItem.productId,
            name: cartItem.name,
            quantity: cartItem.quantity,
        }));

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
            orderTime: orderTime,
            paymentMethod: paymentMethod,
        });

        // Handle payment method specific logic
        if (paymentMethod === 'Cash On Delivery') {
            // For Cash on Delivery
            await cartModels.findOneAndDelete({ userId: userId });
            await newOrder.save();
            res.status(201).json({ success: true, message: 'Order created successfully' });
        } else if (paymentMethod === 'RazorPay') {

            var instance = new Razorpay({ key_id: 'rzp_test_Dc1MSlNThSEKkf', key_secret: 'ojehzUEvc0lwVxNXI57xnRPj' })



                    var options = {
                        amount: totalPrice * 100, 
                        currency: "INR",
                        receipt: "order"+newOrderId
        
                        }

                        instance.orders.create(options, function(err, order) {
                            if(err) {
                                console.error(err);
                            } else {
                                console.log('order', order);
                                res.status(200).json({ orderId: newOrderId, success: true, message: 'Redirect to RazorPay payment page' });
                            }
                        });
                
            }



            // Assuming these variables are available in scope



            




            var { validatePaymentVerification, validateWebhookSignature } = require('./dist/utils/razorpay-utils');
            validatePaymentVerification({ "order_id": razorpayOrderId, "payment_id": razorpayPaymentId }, signature, secret);
        
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};


const apiVerify = async (req, res) => {
    try {

        console.log('req...bodyy', req.body);
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error('Missing required parameters');
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const crypto = require("crypto");
        const expectedSignature = crypto.createHmac('sha256', 'rzp_test_Dc1MSlNThSEKkf')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.status(200).json({ signatureIsValid: true });
        } else {
            res.status(400).json({ signatureIsValid: false });
        }
    } catch (error) {
        console.error('Error in apiVerify:', error.message);
        res.status(400).json({ error: error.message });
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
        // console.log('user',user);
        // console.log('userId',userId);

        const Orders = await orderModels.find({ customer: userId }).populate('products.product');
        // console.log('ordersss',Orders);

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


//-------------------------------------------------
const cancelorder = async (req,res)=>{
    try{
     const id = req.body.orderId
     const orderData = await orderModels.findById(id)
     if(orderData.status !== 'Delivered'){
        orderData.status ='Cancelled';
     }
     await orderData.save()
     
    }catch (error){
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
    viewproduct,
    cancelorder,
    apiVerify
} 
    

