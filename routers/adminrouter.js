const express = require("express");
const router = express.Router();
const controller2 = require('../controller/admincontroller');
const productcontroller = require('../controller/productcontroller');
const catagorycontroller = require('../controller/categorycontroller')
const bodyParser = require('body-parser');
const upload = require('../middlewares/multer')

const { adminExist,verifyAdmin,verifyAdminLoggedOut, } = require("../middlewares/session");



//admin side------------------------------------------------------->
router.get("/admin/login",controller2.admin);
router.all("/dashboard",adminExist,verifyAdminLoggedOut,controller2.dashboard)
router.get("/adhome",verifyAdmin,controller2.adhome)
router.all("/userlist",verifyAdmin,controller2.users)
router.post("/block",verifyAdmin,controller2.block)
router.post('/unblock',verifyAdmin,controller2.unblock)
router.get('/adlogout',verifyAdmin,controller2.logout)


//category side------------------------------------------------------->
router.get('/category',verifyAdmin,catagorycontroller.categoryList)
router.get('/createcat',verifyAdmin,catagorycontroller.createcat)
router.post('/addcat',verifyAdmin,catagorycontroller.addcat)
router.post('/editcat/:id',verifyAdmin,catagorycontroller.editcat)

router.get('/editform/:id',verifyAdmin,catagorycontroller.editform)
router.get('/confirmdel/:id',verifyAdmin,catagorycontroller.confirmdel)
router.post('/deletecat/:id',verifyAdmin,catagorycontroller.deletecat)


//product side------------------------------------------------------->
router.get('/product',verifyAdmin,productcontroller.productList)
router.get('/addform',verifyAdmin,productcontroller.addform)
router.post('/addproduct', verifyAdmin, upload.array('image', 5), productcontroller.addproduct);
router.get('/product/editform/:id',verifyAdmin,upload.array('image', 5),productcontroller.editform)
router.post('/product/updateproduct/:id',verifyAdmin,upload.array('image',5),productcontroller.updateproduct)
router.get('/product/deleteproduct/:id',verifyAdmin,productcontroller.deleteproduct)



module.exports = router