// const orderModels = require('../models/orderModel');
const cartModels = require('../models/cartModel');
const Address = require('../models/addressModel');


const checkout = async (req,res)=>{
    try{
        res.render('./orders/checkout');

    }catch(error){
        console.error('Error fetching user addresses and cart data for checkout:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}



















//modules------------------------------------------------------->
module.exports={
    checkout,
} 