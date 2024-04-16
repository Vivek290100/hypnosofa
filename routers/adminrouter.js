const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const upload = require('../middlewares/multer')
const controller2 = require('../controller/admincontroller');
const controller3 = require('../controller/productcontroller');
const controller4 = require('../controller/categorycontroller')
const controller5=require('../controller/couponcontroller')
const controller6 = require('../controller/categoryoffercontroller')
const controller7 = require('../controller/productoffercontroller')

const { adminExist,verifyAdmin,verifyAdminLoggedOut,handle404 } = require("../middlewares/session");



//admin side------------------------------------------------------->
router.get("/admin/login",adminExist,controller2.admin);
router.all("/dashboard",adminExist,verifyAdminLoggedOut,controller2.dashboard)
router.get("/adhome",verifyAdmin,controller2.adhome)
router.all("/userlist",verifyAdmin,controller2.users)
router.post("/block",verifyAdmin,controller2.block)
router.post('/unblock',verifyAdmin,controller2.unblock)
router.get('/adlogout',verifyAdmin,controller2.logout)




//order list-------------------------------------------->
router.get("/userorder",verifyAdmin,controller2.userOrder);
router.post('/updateOrderStatus', controller2.updateOrderStatus);
router.get('/download-sales-report', verifyAdmin, controller2.salesReport);



//product side------------------------------------------------------->
router.get('/product',verifyAdmin,controller3.productList)
router.get('/addform',verifyAdmin,controller3.addform)
router.post('/addproduct', verifyAdmin, upload.array('image', 5), controller3.addproduct);
router.get('/product/editform/:id',verifyAdmin,upload.array('image', 5),controller3.editform)
router.post('/product/updateproduct/:id',verifyAdmin,upload.array('image',5),controller3.updateproduct)
router.post('/product/deleteproduct', verifyAdmin, controller3.deleteproduct); // Corrected route definition

//category side------------------------------------------------------->
router.get('/category',verifyAdmin,controller4.categoryList)
router.get('/createcat',verifyAdmin,controller4.createcat)
router.post('/addcat',verifyAdmin,controller4.addcat)
router.post('/editcat/:id',verifyAdmin,controller4.editCategory)
router.get('/editcat/:id', verifyAdmin, controller4.editCategoryForm);

router.get('/confirmdel/:id',verifyAdmin,controller4.confirmdel)
router.post('/deletecat',verifyAdmin, controller4.deleteCategory);

//coupon------------------------------------------------------->
router.get('/couponlist',verifyAdmin,controller5.coupon)
router.get('/coupons/add',verifyAdmin,controller5.addcouponform)
router.post('/admin/create-coupon',verifyAdmin,controller5.createCoupon)
router.get('/edit-coupon/:couponId',verifyAdmin, controller5.showEditCouponForm);
router.put('/admin/edit-coupon/:couponId',verifyAdmin, controller5.editCoupon);
router.delete('/delete-coupons/:couponId',verifyAdmin,controller5.deletecoupon)


//category offer---------------------------------------------------
router.get('/admin/categoryoffer',verifyAdmin,controller6.CategoryOffers)
router.post('/admin/edit-category-offer',verifyAdmin,controller6.editOffer);
router.delete('/admin/delete-category-offer/:categoryId', verifyAdmin, controller6.deleteOffer);

//product offer---------------------------------------------------
router.get('/admin/productoffer',verifyAdmin,controller7.ProductOffers)
router.put('/admin/edit-product-offer/:productId/:startDate/:expiryDate/:percentage',verifyAdmin,controller7.editProductOffer);
router.delete('/admin/delete-product-offer/:productId', verifyAdmin, controller7.deleteProductOffer);



router.use(handle404);

module.exports = router