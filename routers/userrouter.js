//userrouter.js
const express = require("express");
const router = express.Router();
const controller = require('../controller/userController');
const controller1 = require('../controller/otpcontroller');
const controller2 = require('../controller/resetpassword');
const controller3= require('../controller/userprofilecontroller');
const controller4= require('../controller/cartcontroller');
const controller5= require('../controller/ordercontroller');
const controller6 = require('../controller/usercoupon.controller')

const { verifyUser, userExist,checkUserStatus,handle404 } = require("../middlewares/session");



//user side------------------------------------------------------->
router.get("/",checkUserStatus,controller.home);
router.get("/user/product",checkUserStatus,verifyUser,controller.product);
router.get("/user/mainproduct/:productId",checkUserStatus,verifyUser, controller.mainproduct);
router.get('/user/signup',checkUserStatus,userExist,controller.signup)
router.all('/user/login',checkUserStatus,userExist,controller.login)
router.all('/login1',checkUserStatus,userExist,controller.login1)
router.get('/user/logout',verifyUser,controller.logout)
router.get('/user/about',verifyUser,controller.about)
router.post('/wishlist/add',verifyUser,controller.wishlist); 
router.get('/wishlist', verifyUser,controller.wishlistdb);
router.delete('/:productId',verifyUser,controller.removeFromWishlist); 

//coupon-------------------------------------------------------
router.get('/coupon',verifyUser,controller.coupon)
router.get('/validate-coupon',verifyUser,controller6.validcoupon)
router.post('/remove-coupon',verifyUser,controller6.removeCoupon);

//user signup otp ------------------------------------------------------->
router.post('/send',userExist,controller1.otp1)
router.post('/verify',userExist,controller1.verify)
router.get('/resend',userExist,controller1.resend)
router.get('/logout',verifyUser,controller.logout)
router.post('/verifyReferral',controller1.verifyreferralcode)


//login forgot password otp------------------------------------------------------->
router.get('/user/forgot-password', controller2.showForgotPasswordForm);
router.post('/user/forgot-password', controller2.forgotPassword);
router.post('/user/reset-password', controller2.resetPassword);
router.get('/otpresend',controller2.otpresend)
 
//user profile------------------------------------------------------->
router.get("/user/profile",verifyUser,controller3.userprofile);
router.post("/change-password",verifyUser,controller3.changepassword)
router.post('/save-address',verifyUser, controller3.saveAddress);
router.get('/user/deleteaddress/:id',verifyUser,controller3.deleteAddress);
router.post('/save-user',verifyUser, controller3.saveUser);
router.get('/edit-address/:id',verifyUser, controller3.editaddress)
router.post('/submit-address/:addressId',verifyUser, controller3.updateAddress);
router.get('/walletHistory',verifyUser,controller3.walletHistory)


//user cart------------------------------------------------------->
router.get('/user/cart',verifyUser,controller4.usercart);
router.get('/user/addtocart/:productId', verifyUser, controller4.addToCart);
router.get('/removeItem/:productId',verifyUser, controller4.removeFromCart);
router.put('/updateQuantity/:productId',verifyUser, controller4.updateQuantity)
router.get('/getTotalPrice',verifyUser,controller4.totalprice)
router.get('/getProductPrice',verifyUser, controller4.getUpdatedPrice);



//checkout---------------------------------------------------
router.get('/checkout',verifyUser,controller5.checkout);
router.post('/placeorder',verifyUser, controller5.createOrder);
router.get('/user/successorder',verifyUser,controller5.successorder);
router.get('/user/userOrder',verifyUser, controller5.userorders);
router.get('/viewproduct',verifyUser, controller5.viewproduct)
router.post('/cancelOrder',verifyUser,controller5.cancelorder)
router.post('/paymentVerify',verifyUser,controller5.paymentVerify)
router.get('/addaddresscheckout',verifyUser,controller5.addaddresscheckout)
router.post('/addaddresscheckoutt',verifyUser,controller5.addaddresscheckoutt)

// router.use(handle404);






module.exports = router;
