

const User = require('../models/userModel');
const Product=require('../models/productModel')

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
               return res.redirect('./user/login', { error1: req.flash('error1') });
           }
       } catch (error) {
           console.error(error);
           req.flash('error', 'Internal Server Error');
           return res.status(500).render('error', { error1: req.flash('error') });
       }
   };


//user products------------------------------------------------------->
const product = async (req, res) => {
    try {
        const user = req.session.user;
        let query = {}; 
        const searchQuery = req.query.q; 
        let sortCriteria = req.query.sort; 
        
        if (searchQuery) {
            query = { name: { $regex: new RegExp(searchQuery, 'i') } };
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

        const products = await Product.find({ ...query, isDeleted: false }).sort(sortOptions).populate('category');
        const cartItemCount = req.session.cartItemCount;
        res.render('./user/products', {
            title: 'Products',
            products,
            user,
            cartItemCount,
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
        
        if (!product) {
            console.log("Product not found");
            return res.render('./user/mainproduct', { title: 'Product Not Found' });
        }
        const user = req.session.user;
        cartItemCount=req.session.cartItemCount

        res.render('./user/mainproduct',{title: 'Products', product,user})        
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




const render404 = (req, res) => {
    const user = req.session.user;
    res.status(404).render('./user/404',{user,user});
};



module.exports = {
    home,
    signup,
    login,
    login1,
    logout,
    product,
    mainproduct,
    render404
};
