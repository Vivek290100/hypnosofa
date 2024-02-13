// cartCountMiddleware.js

const Cart = require("../models/cartModel");
const User = require("../models/userModel");

const cartCountMiddleware = async (req, res, next) => {
    try {
        if (req.session && req.session.user && req.session.user.email) {
            const email = req.session.user.email;
            const user = await User.findOne({ email: email });
            if (user) {
                const userId = user._id;
                const cartData = await Cart.findOne({ userId });
                if (cartData) {
                    const cartCount = cartData.products.length
                    console.log("cartCount:", cartCount);
                    res.locals.cartCount = cartCount;
                    res.locals.name = user.name;
                } else {
                    console.log("Cart data not found");
                    res.locals.cartCount = 0;
                    res.locals.name = user.name;
                }
            } else {
               
                res.locals.cartCount = 0;
            }
        } else {
            
            res.locals.cartCount = 0;
        }

        next();
    } catch (error) {
        console.error(error);
        res.locals.cartCount = 0;
        next();
    }
};

module.exports = cartCountMiddleware;
