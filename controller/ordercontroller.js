const orderModels = require('../models/orderModel');
const cartModels = require('../models/cartModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');



const checkout = async (req, res) => {
    try {
        const user = req.session.user;
        const addresses = await Address.find();
        const cart = await cartModels.findOne({ userId: user._id });
        const cartItems = cart ? cart.products : [];

        let totalPrice = 0;

        for (const item of cartItems) {
            try {
                // Fetch the product document for the productId
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

        //console.log('Total Price:', totalPrice);


        res.render('./orders/checkout', { addresses, user, cartItems, totalPrice });
    } catch (error) {
        console.error('Error fetching user addresses and cart data for checkout:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


//-----create orderdatabase--------------------------------------------
const createOrder = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const userId = req.session.user._id;
        console.log("useriddd",userId);
        const { addressIndex, paymentMethod } = req.body;

        console.log("Received data - userId:", userId, "addressId:", addressIndex, "paymentMethod:", paymentMethod);

        // Your logic to create the order...

        res.status(201).json({ success: true, message: 'Order created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};

















//modules------------------------------------------------------->
module.exports={
    checkout,
    createOrder,
} 