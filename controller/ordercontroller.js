// C:\Users\vivek_laxvnt1\Desktop\Tasks\Week 7-12 Project Week\hypnosofa\controller\ordercontroller.js
const orderModels = require('../models/orderModel');
const cartModels = require('../models/cartModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const moment = require('moment');
const mongoose = require('mongoose');
const ejs = require('ejs');
const { Types: { ObjectId } } = require('mongoose');
const Razorpay = require('razorpay')
const crypto = require('crypto');
const Wallet=require('../models/walletModel')
const WalletHistory = require('../models/walletHistoryModel')
const Coupon = require('../models/couponModel')
const fs = require("fs");
const html_to_pdf = require('html-pdf-node');
const path = require('path');  
const User = require("../models/userModel");




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
        const addresses = await Address.find({ userId: user._id });
        const cart = await cartModels.findOne({ userId: user._id });
        const cartItems = cart ? cart.products : [];

        let totalPrice = 100;

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

        if(totalPrice<101){
            res.redirect('/user/cart')
        }

        const wallet = await Wallet.findOne({ user: user._id });
        const walletBalance = wallet ? wallet.balance : 0;
        const amount =  walletBalance; 
        const userCoupons = await Coupon.find();
        const length = cartItems.length


        res.render('./orders/checkout', { addresses, user, cartItems, totalPrice, amount,coupons: userCoupons, length: length});
    } catch (error) {
        console.error('Error fetching user addresses and cart data for checkout:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

}



//order time--------------------------
function getCurrentTime() {
    return moment().format('hh:mm A');
}


const createOrder = async (req, res, addresses) => {
    try {
        const orderTime = getCurrentTime();
        const currentDate = moment();
        const orderDate = currentDate.format('DD-MM-YYYY');
        const userId = req.session.user._id;
        const { addressIndex, paymentMethod,couponCode } = req.body;
        let totalPrice = 0;
        const coupondb = await Coupon.findOne();
        const cart = await cartModels.findOne({ userId: userId });
        const cartItems = cart ? cart.products : [];

        for (const item of cartItems) {
            try {
                const product = await Product.findById(item.productId);

                if (product && product.quantity >= item.quantity) {
                    product.quantity -= item.quantity; 
                    await product.save();
                } else {
                    return res.status(400).json({ success: false, message: 'Insufficient stock for one or more items' });
                }
            } catch (error) {
                console.error('Error updating product stock:', error);
                return res.status(500).json({ success: false, message: 'Failed to create order' });
            }
        }

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
        const TotalPriceAfterDiscount = totalPrice - discountAmount;

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
        
        if (paymentMethod === 'Cash On Delivery') {
            const newOrder = new orderModels(newOrderData);
            await cartModels.findOneAndDelete({ userId: userId });
            await newOrder.save();
            res.status(200).json({ success: true, message: 'Order created successfully' });
        } else if (paymentMethod === 'RazorPay') {
            const razorpay_signature = 'rzp_test_Dc1MSlNThSEKkf';
            if (razorpay_signature == razorpay_signature) {
                const newOrder = new orderModels(newOrderData);
                console.log('razorpay order', newOrder); 
                await cartModels.findOneAndDelete({ userId: userId });
                await newOrder.save();
                res.status(200).json({ success: true, message: 'Order created successfully' });
            }
        }
        else if(paymentMethod=='Wallet'){
            const userWallet = await Wallet.findOne({ user: userId });

            if (!userWallet) {
                return res.status(400).json({ success: false, message: 'Wallet not found for user' });
            }
            if (userWallet.balance < TotalPriceAfterDiscount) {
                return res.status(400).json({ success: false, message: 'Insufficient funds in wallet' });
            }

            userWallet.balance -= TotalPriceAfterDiscount;
            await userWallet.save();

            const walletHistory = new WalletHistory({
                wallet: userWallet._id,
                transactionType: 'debit',
                amount: TotalPriceAfterDiscount,
                description: 'Amount debited for order purchase',
            });
            await walletHistory.save();
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

//---------Custom Payment Error Handler -----------------
const faildPaymentHandler = async (req, res, addresses) => {
        const orderTime = getCurrentTime();
        const currentDate = moment();
        const orderDate = currentDate.format('DD-MM-YYYY');
        const userId = req.session.user._id;
        const { addressIndex, paymentMethod,couponCode } = req.body;

        let totalPrice = 0;

        const coupondb = await Coupon.findOne();
        const cart = await cartModels.findOne({ userId: userId });
        const cartItems = cart ? cart.products : [];

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
        const TotalPriceAfterDiscount = totalPrice - discountAmount;
        const userAddress = await Address.findOne({ user: userId });
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
            paymentMethod: 'RazorPay',
            status : 'PaymentFailed'

        };
            const razorpay_signature = 'rzp_test_Dc1MSlNThSEKkf';
                const newOrder = new orderModels(newOrderData);
                await cartModels.findOneAndDelete({ userId: userId });
                try {
                    const saveStatus = await newOrder.save();
                    if (!saveStatus) {
                        res.status(400).json({ success: false, message: 'Failed to save order' });
                        return;
                    }
                    res.status(200).json({ success: true, message: 'Order created successfully' });
                } catch (error) {
                    console.error('Error saving order:', error);
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
        receipt: generateOrderID() 
    };
    instance.orders.create(razorpayOptions, function (err, razorpayOrder) {
    res.status(200).json({ razorpayOrder });
    });
};




const successorder = async (req, res) => {
    try {
        const user = req.session.user;
        res.render("./orders/successorder", { pageTitle: "confirm", user});
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };



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
        let TotalPrice = 0;
        if (orderpayment === 'RazorPay' || orderpayment === 'Wallet') {
             TotalPrice = orderData.totals.subtotal;
            const userWallet = await Wallet.findOne({ user: userId });
            if (!userWallet) {
                const newWallet = new Wallet({ user: userId, balance: 0 });
                newWallet.balance = TotalPrice;
                await newWallet.save();
            } else {
                userWallet.balance += TotalPrice;
                await userWallet.save();
            }

            const walletHistory = new WalletHistory({
                wallet: userWallet._id,
                transactionType: 'credit',
                amount: TotalPrice,
                description: 'Amount credited to wallet due to order cancellation',
            });
            await walletHistory.save();
        } 
        await orderData.save();
        res.redirect('/user/orders');
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}




const addaddresscheckout = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = req.session.user._id;
        const addresses = await Address.find();
        const addressIds = addresses.map(address => address._id);

        res.render('./orders/addaddress', { userId: userId, addressId: addressIds , user:user});
    } catch (error) {
        console.error('Error rendering add address page:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const addaddresscheckoutt = async (req, res) => {
    try {
        const userId = req.session.user._id;
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


const downloadinvoice = async (req, res) => {
  try {
    const orderId = req.query.orderId;

    if (!orderId) {
      return res.status(400).send("Order ID is required");
    }

    const orderDetails = await orderModels
      .findById(orderId)
      .populate("customer")
      .populate("products.product");

    if (!orderDetails) {
      return res.status(404).send("Order not found");
    }

    const templatePath = path.join(__dirname, "../views/orders/invoice.ejs");
    const templateContent = fs.readFileSync(templatePath, "utf-8");

    const renderedHTML = ejs.render(templateContent, {
      order: orderDetails,
      orderDetails: orderDetails,
      user: orderDetails.customer,
      products: orderDetails.products,
      moment,
    });

    const pdfBuffer = await html_to_pdf.generatePdf(
      { content: renderedHTML },
      {
        format: "A4",
        margin: { top: 50, bottom: 60, left: 40, right: 40 },
        printBackground: true,
      }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${orderDetails.orderID || orderId}.pdf`
    );
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Invoice Generation Error:", error.message);
    res.status(500).send("Failed to generate invoice");
  }
};
  

//   const generateRazorpay = async (req,res ) =>{


//   }





module.exports={
    checkout,
    createOrder,
    successorder,
    userorders,
    viewproduct,
    cancelorder,
    paymentVerify,
    addaddresscheckout,
    addaddresscheckoutt,
    downloadinvoice,
    faildPaymentHandler,
    // generateRazorpay
} 