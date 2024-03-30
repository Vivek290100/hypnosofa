

const User = require('../models/userModel');
const Product=require('../models/productModel')
const Category = require('../models/categoryModel'); 
const Wishlist = require('../models/wishlistModel')
const Coupon = require('../models/couponModel')
const cartModels = require('../models/cartModel');
const orderModel = require('../models/orderModel')
const ProductOffer = require("../models/productofferModel");

 
const bcrypt = require('bcrypt');
const cartItemCountMiddleware = require('../middlewares/cartCountMiddleware');


//user home------------------------------------------------------->
const home = async (req, res) => {
    try {
        const user = req.session.user;

        const products = await Product.find({isDeleted : false}).exec();

    res.render("./user/userhome", { pageTitle: "userhome", user,  products});
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



//user signup------------------------------------------------------->
const signup=(req, res) => {
    res.render('./user/signup', { error: req.flash('error') });
  };


  //user login------------------------------------------------------->  
const login = (req, res) => {
    const email=req.session.email
    res.render("./user/login", { error1: req.flash('error1')[0] || '' });
}


//checking the user valid or invalid------------------------------------------------------->
const login1 = async (req, res) => {
    const { email, password } = req.body;
    const products = await Product.find({isDeleted : false}).exec();
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error1', 'Invalid email or password');
            return res.render('./user/login', { error1: req.flash('error1') });
        }
        if (user.status === 'blocked') {
            req.flash('error1', 'User is blocked. Cannot log in.');
            return res.render('./user/login', { error1: req.flash('error1') });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
           
            req.session.logged = true;
            req.session.user = {
            name: user.name,
            email: user.email,
           _id: user._id,
   };
   await cartItemCountMiddleware(req, res, () => {});
   const products = await Product.find({isDeleted : false}).exec();
               return res.render('./user/userhome', { user ,products});
           } else {
               req.flash('error1', 'Invalid email or password');
               return res.render('./user/login', { error1: req.flash('error1') });
           }
       } catch (error) {
           console.error(error);
           req.flash('error', 'Internal Server Error');
           return res.status(500).render('error', { error1: req.flash('error') });
       }
   };


   const product = async (req, res) => {
    try {
        const user = req.session.user;
        let query = {}; 
        const searchQuery = req.query.q; 
        let sortCriteria = req.query.sort; 
        let categoryFilter = req.query.category;
        
        // Pagination
        const currentPage = parseInt(req.query.page) || 1; 
        const perPage = 8;
        const skip = (currentPage - 1) * perPage;

        if (searchQuery) {
            query.name = { $regex: new RegExp(searchQuery, 'i')  };
        }

        if (categoryFilter) {
            query.category = categoryFilter;
        }
        

        let sortOptions = {};
        switch (sortCriteria) {
            case 'price_low_high':
                sortOptions = { price: 1 };
                break;
            case 'price_high_low':
                sortOptions = { price: -1 };
                break;
            case 'name_a_z':
                sortOptions = { name: 1 };
                break;
            case 'name_z_a':
                sortOptions = { name: -1 };
                break;
            default:
                break;
        }

        // Count total number of products
        const totalProducts = await Product.countDocuments({ ...query, isDeleted: false });

        // Calculate total number of pages
        const totalPages = Math.ceil(totalProducts / perPage);

        const products = await Product.find({ ...query, isDeleted: false })
                                      .sort(sortOptions)
                                      .populate('category')
                                      .skip(skip)
                                      .limit(perPage);

        //product Offer
        const productoffer = await ProductOffer.find().select('discountPercentage product').exec();        
        // console.log('productoffer',productoffer);

       


        // Calculate discounted prices
        const discountedProducts = products.map(product => {
            const offer = productoffer.find(offer => offer.product.equals(product._id));
            const discountedPrice = offer ? product.price * (1 - offer.discountPercentage / 100) : product.price;
            return { ...product.toObject(), discountedPrice,offer };
        });

        // console.log('discountedProducts',discountedProducts); 

        const cartItemCount = req.session.cartItemCount;
        const categories = await Category.find(); 

      



        res.render('./user/products', {
            title: 'Products',
            products: discountedProducts,
            user,
            cartItemCount,
            categories,
            currentPage,
            sortCriteria,
            totalPages,
            
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).render('error500');
    }
};





//user main product page------------------------------------------------------->
const mainproduct = async (req,res)=>{
    
    try {
        const productId = req.params.productId; 
        const product = await Product.findById(productId).populate('category');
        const categories = await Category.find();
        
        if (!product) {
            console.log("Product not found");
            return res.render('./user/mainproduct', { title: 'Product Not Found' });
        }

        const productOffers = await ProductOffer.find({ product: productId });

        // console.log(productOffers);

       
        const user = req.session.user;
        cartItemCount=req.session.cartItemCount
        

        res.render('./user/mainproduct',{title: 'Products', product,productOffers,user,categories})  
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
}


//user logout------------------------------------------------------->
const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.redirect('/user/login'); 
        } else {
            res.redirect('/');
        }
    });
};


const about = (req,res)=>{
    const user = req.session.user;
    res.render('./user/about',{user})
}


const wishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const  productId  =req.body.productId
        // console.log('productId',productId);

        const product = await Product.findById(productId);

        if (!product) {
            // return res.status(404).json({ error: 'Product not found' });

            // console.log('Product not found' );
        }

        const wishlistItem = new Wishlist({
            userId: user._id, 
            productId : product
        });
        // console.log('wishlistItem', wishlistItem);

        await wishlistItem.save();

        res.status(201).json({ message: 'Wishlist item added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




const wishlistdb = async (req, res) => {
    try {
        const user = req.session.user;
       


                const categories = await Category.find();

        const wishlistItems = await Wishlist.find({ userId: user._id }).populate('productId','category');
        let products = [];
        for (let i of wishlistItems) {
            const product = await Product.findById(i.productId);
            if (product) {
                products.push(product);
            }
        }

        const productoffer = await ProductOffer.find().select('discountPercentage product').exec();        
        // console.log('productoffer',productoffer);

        const discountedProducts = products.map(product => {
            const offer = productoffer.find(offer => offer.product.equals(product._id));
            const discountedPrice = offer ? product.price * (1 - offer.discountPercentage / 100) : product.price;
            return { ...product.toObject(), discountedPrice,offer };
        });

        // console.log('discountedProducts',discountedProducts);


        // console.log(' pc.productId',products );

        // console.log("this are ",products) 

        res.render('user/wishlist', { user, products: discountedProducts,categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        // console.log('productIdiii',productId); 
        const userId = req.session.user._id;  

        await Wishlist.findOneAndDelete({ userId, productId });

        res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const coupon = async (req, res) => {
    try {
        const user = req.session.user;

        const userCoupons = await Coupon.find();
        res.render('./user/coupon', { user, coupons: userCoupons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}




// const validcoupon = async (req, res) => {
//     try {
//         const couponCode = req.query.code;
//         const userId = req.session.user._id;
        
//         const coupon = await Coupon.findOne({ couponCode });
        
        
//         if (!coupon) {
//             return res.json({
//                 valid: false,
//                 message: "Invalid coupon code.",
//             });
//         }
        
//         const currentDate = new Date();
//         const startDate = coupon.startDate;
//         const expiryDate = coupon.expiryDate;
//         if (currentDate < startDate || currentDate > expiryDate) {
//             return res.json({
//                 valid: false,
//                 message: "Coupon is expired or not yet valid.",
//             });
//         }
        
//         const isCouponUsed = await orderModel.exists({
//             customer: userId,
//             "totals.couponCode": couponCode,
//             status: { $ne: "Cancelled" },
//         });
//         if (isCouponUsed) {
//             return res.json({
//                 valid: false,
//                 message: "Coupon is already used in a previous order.",
//             });
//         }
        
//         const cart = await cartModels.findOne({ userId });
//         const originalTotal = cart.totals.totalprice;
//         const discountAmount = coupon.discountAmount;
//         const discountedTotal = Math.max(originalTotal - discountAmount, 0);
        
//         await cartModels.findOneAndUpdate(
//             { userId },
//             {
//                 $set: {
//                     "totals.discountAmount": discountAmount,
//                     "totals.discountedTotal": discountedTotal,
//                 },
//             },
//             { new: true }
//         );
        
//         return res.json({
//             valid: true,
//             discountedTotal: discountedTotal.toFixed(2),
//         });
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }




// const removeCoupon = async (req, res) => {
//     const couponCode = req.query.code;
//     try {
//       const userId = req.session.user._id;
//       const coupon = await Coupon.findOne().populate('couponCode')
//       if (!coupon) {
//         res.status(404).json({
//           error: "Coupon not found.",
//         });
//         return;
//       }
//       const cart = await cartModels
//         .findOne({ userId })
//         .populate("products.productId", "name price description image");
//       const updatedcart = await cartModels.findOneAndUpdate(
//         { userId },
//         {
//           $set: {
//             "totals.discountAmount": 0,
//             "totals.discountedTotal": cart.totals.totalprice,
//           },
//         },
//         { new: true }
//       );
//       res.status(200).json({
//         success: true,
//       });
//     } catch (error) {
//       console.error("Error removing discount:", error);
//       res.status(500).json({
//         error: "Internal server error",
//       });
//     }
//   };



module.exports = {
    home,
    signup,
    login,
    login1,
    logout,
    product,
    mainproduct,
    about,
    wishlist,
    wishlistdb,
    removeFromWishlist,
    coupon,
    // validcoupon,
    // removeCoupon
};
