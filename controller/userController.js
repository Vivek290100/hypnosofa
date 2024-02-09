

const User = require('../models/userModel');
const Product=require('../models/productModel')

const bcrypt = require('bcrypt');

//user home------------------------------------------------------->
const home = async (req, res) => {
    try {
        const user = req.session.user;
        const products = await Product.find().exec();

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
    //const email=req.session.email
    // console.log(email);
    res.render("./user/login", { error1: req.flash('error1')[0] || '' });
}


//checking the user valid or invalid------------------------------------------------------->
const login1 = async (req, res) => {
    const { email, password } = req.body;
    const products = await Product.find().exec();
    // console.log({email,password});
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
// const products = await Product.find().exec();
return res.render('./user/userhome', { user , products  });
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


//user products------------------------------------------------------->
const product = async (req, res) => {
    try {
        const user = req.session.user;
        console.log("user",user);
        const products = await Product.find().populate('category');

        console.log("product",products);
    
        res.render('./user/products', {
            title: 'Products',
            products,
              // It seems like `categories` is not defined in the provided code.
            user,
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
         // console.log("product idddd: ", productId);
         // console.log("productttt: ", product);
        if (!product) {
            console.log("Product not found");
            return res.render('./user/mainproduct', { title: 'Product Not Found' });
        }
        const user = req.session.user;
        console.log(user);
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
            // const logoutMessage = 'Successfully logged out.';
            res.redirect('/');
        }
    });
};




module.exports = {
    home,
    signup,
    login,
    login1,
    logout,
    product,
    mainproduct
};
