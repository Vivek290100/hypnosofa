const orderModels = require('../models/orderModel');
const cartModels = require('../models/cartModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const moment = require('moment');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
const Razorpay = require('razorpay')
const crypto = require('crypto');
const Wallet=require('../models/walletModel')
const Coupon = require('../models/couponModel')



var instance = new Razorpay({
    key_id: 'rzp_test_Dc1MSlNThSEKkf',
    key_secret: 'ojehzUEvc0lwVxNXI57xnRPj',
  });

  function generateOrderID(){
    const safeIndex=Math.floor(Math.random()*100000)
    const fiveDigitId=String(safeIndex+1).padStart(5,"0")
    return fiveDigitId
  }

  function hmac_sha256(data, key_secret) {
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(data);
    return hmac.digest('hex');
  }



  

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
                
                if (product && product.price) {
                    totalPrice += item.price * item.quantity;
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }

        if(totalPrice<1){
            res.redirect('/user/cart')
        }


        const wallet = await Wallet.findOne({ user: user._id });
        const walletBalance = wallet ? wallet.balance : 0;
        
        const amount =  walletBalance; 

        const userCoupons = await Coupon.find();
        const length = cartItems.length
        console.log('length',length);

        // console.log('carttitermsss',cartItems);

        res.render('./orders/checkout', { addresses, user, cartItems, totalPrice, amount,coupons: userCoupons, length: length});
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
        console.log("Request Body:", req.body);
        const orderTime = getCurrentTime();
        const currentDate = moment();
        const orderDate = currentDate.format('DD-MM-YYYY');
        const userId = req.session.user._id;
        const { addressIndex, paymentMethod,couponCode } = req.body;
        // const couponCode = req.query.code; 
        // console.log('couponCode',couponCode);
        let totalPrice = 0;

        // console.log(req.body);
        const coupondb = await Coupon.findOne();

        
        const cart = await cartModels.findOne({ userId: userId });
        const cartItems = cart ? cart.products : [];

        // console.log('appliedCoupon',appliedCoupon);
        // console.log('coupondb',coupondb);
        // console.log("productsss",products);
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


        totalPrice = cart.totals.totalprice;

        const products = cart.products.map(cartItem => ({
            product: cartItem.productId,
            name: cartItem.name,
            quantity: cartItem.quantity,
        }));

        let discountTotal = 0;
        let discountAmount = 0;
        let couponCodeApplied = '';

        if (couponCode) {
            const appliedCoupon = await Coupon.findOne({ couponCode });

        if (appliedCoupon) {
          discountAmount = appliedCoupon.discountAmount;
          couponCodeApplied = appliedCoupon.couponCode;
        } 
        }
        // console.log('appliedCoupon',appliedCoupon);
        const TotalPriceAfterDiscount = totalPrice - discountAmount;
        // console.log('TotalPriceAfterDiscount',TotalPriceAfterDiscount);

        const newOrderId = new ObjectId().toString(); 
            const newOrderData = {
            orderID: newOrderId,
            customer: userId,
            products: cartItems.map(item => ({ product: item.productId, quantity: item.quantity })),
            address: addresses[addressIndex],
            totals: {
                subtotal: totalPrice,
                totalprice: TotalPriceAfterDiscount,
                discountTotal : TotalPriceAfterDiscount,
                couponCode: couponCodeApplied,
                discountAmount: discountAmount,
            },
            orderDate: orderDate,
            orderTime: orderTime,
            paymentMethod: paymentMethod,

        };
        // console.log('discountTotal',discountTotal);
        // console.log('couponCode',couponCode);
        // console.log('discountAmount',discountAmount);

        if (paymentMethod === 'Cash On Delivery') {
            const newOrder = new orderModels(newOrderData);
            // console.log('neworderrrr', newOrder);
            await cartModels.findOneAndDelete({ userId: userId });
            await newOrder.save();
            res.status(200).json({ success: true, message: 'Order created successfully' });
        } else if (paymentMethod === 'RazorPay') {
            const razorpay_signature = 'rzp_test_Dc1MSlNThSEKkf';
            if (razorpay_signature == razorpay_signature) {
                const newOrder = new orderModels(newOrderData);
                // console.log('neworderrrrazorpay', newOrder); 
                await cartModels.findOneAndDelete({ userId: userId });
                await newOrder.save();
                res.status(200).json({ success: true, message: 'Order created successfully' });
            }
        }
        else if(paymentMethod=='Wallet'){
            const userWallet = await Wallet.findOne({ user: userId });
            
            // console.log("User Wallet:", userWallet); 

            if (!userWallet) {
                return res.status(400).json({ success: false, message: 'Wallet not found for user' });
            }
            if (userWallet.balance < TotalPriceAfterDiscount) {
                return res.status(400).json({ success: false, message: 'Insufficient funds in wallet' });
            }
            // console.log("Total Price of Order:", totalPrice); 


            userWallet.balance -= TotalPriceAfterDiscount;
            await userWallet.save();
            // console.log("Updated Wallet Balance:", userWallet.balance);


            const newOrder = new orderModels(newOrderData);
            await cartModels.findOneAndDelete({ userId: userId });
            await newOrder.save();
            res.status(200).json({ success: true, message: 'Order created successfully' });
            
        }
        else {
            res.status(400).json({ success: false, message: 'Invalid payment method' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }

};



const paymentVerify = async (req, res) => {
    const { amount } = req.body;

    const razorpaySecretKey = 'rzp_test_Dc1MSlNThSEKkf';
    let amountParsed = parseInt(amount);
    const amountInPaise = Math.round(amountParsed * 100);
    const razorpayOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: generateOrderID() // Assuming generateOrderID is defined elsewhere
    };
    instance.orders.create(razorpayOptions, function (err, razorpayOrder) {
    res.status(200).json({ razorpayOrder });
    });
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
       
        const Orders = await orderModels.find({ customer: userId }).populate('products.product');

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



const cancelorder = async (req, res) => {
    try {
        const id = req.body.orderId;
        const userId = req.session.user._id;
        const user = req.session.user;

        const orderData = await orderModels.findById(id);
        if (!orderData) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (orderData.status !== 'Delivered') {
            orderData.status = 'Cancelled';
        }

        const orderpayment = orderData.paymentMethod;
        console.log("orderpayment",orderpayment);


        let TotalPrice = 0;

        if (orderpayment === 'RazorPay' || orderpayment === 'Wallet') {
             TotalPrice = orderData.totals.subtotal;
            // console.log('TotalPrice',TotalPrice);

            const userWallet = await Wallet.findOne({ user: userId });
            if (!userWallet) {
                // Create new wallet if it doesn't exist
                const newWallet = new Wallet({ user: userId, balance: 0 });
                newWallet.balance = TotalPrice;
                await newWallet.save();
                console.log('Wallet created and saved successfully.');
            } else {
                // Update existing wallet balance
                userWallet.balance += TotalPrice;
                await userWallet.save();
                console.log('Wallet updated successfully.');
            }
        }

        await orderData.save();
        res.redirect('/user/orders');
        // res.render('./orders/checkout', { user: user, amount: TotalPrice });
        // res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


const addaddresscheckout = async (req, res) => {
    try {
        const user = req.session.user;

        const userId = req.session.user._id;
        console.log('User ID:', userId);

        const addresses = await Address.find();
        const addressIds = addresses.map(address => address._id);
        console.log('Address IDs:', addressIds);

        res.render('./orders/addaddress', { userId: userId, addressId: addressIds , user:user});
    } catch (error) {
        console.error('Error rendering add address page:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addaddresscheckoutt = async (req, res) => {
    try {
        
        console.log('Request Body:', req.body);
        const userId = req.session.user._id;
        console.log('User ID:', userId);

        const { mobile, pincode, houseName, locality, city, district, state } = req.body;

        const newAddress = new Address({
            mobile,
            pincode,
            houseName,
            locality,
            city,
            district,
            state
        });

        await newAddress.save();
        res.status(200).json({ success: true, message: 'Address added successfully' });
    } catch (error) {
        console.error('Error adding new address:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};





//modules------------------------------------------------------->
module.exports={
    checkout,
    createOrder,
    successorder,
    userorders,
    viewproduct,
    cancelorder,
    paymentVerify,
    addaddresscheckout,
    addaddresscheckoutt
} 