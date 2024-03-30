const Coupon = require("../models/couponModel");




function formatDate(date) {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${dayOfWeek} ${month} ${day} ${year}`;
  }



  function formatDated(date) {
    if (!date) return null;
  
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }




const coupon = async (req, res) => {
    try {
      const coupons = await Coupon.find()
      const formattedCoupons = coupons.map((coupon) => ({
        ...coupon._doc,
        startDate: formatDated(coupon.startDate),
        expiryDate: formatDated(coupon.expiryDate),
      }));

        res.render('coupon/couponList',{ 
          coupons: formattedCoupons,
        })
        
    } catch (error) {
        console.error("Error in coupon function:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const addcouponform = async (req, res) => {
    try {
      res.render("./coupon/createCoupon.ejs");
    } catch (error) {
      next(error);
    }
  };


    const createCoupon = async (req, res) => {
        try {
          const {
            couponCode,
            minPurchaseAmount,
            discountAmount,
            startDate,
            expiryDate,
          } = req.body;
          const newCoupon = new Coupon({
            couponCode,
            minPurchaseAmount,
            discountAmount,
            startDate: new Date(req.body.startDate),
            expiryDate: new Date(req.body.expiryDate),
          });
          await newCoupon.save();
          return res
            .status(200)
            .json({ success: true, message: "Coupon created successfully." });
        } catch (error) {
          console.error("Error creating coupon:", error);
          req.flash("error", "Failed to create coupon. Please try again.");
          res.redirect("/admin/create-coupon");
        }
      };


      


      const showEditCouponForm = async (req, res, next) => {
        try {
          const couponId = req.params.couponId;
          const coupon = await Coupon.findById(couponId);
          if (!coupon) {
            return res.status(404).send("Coupon not found");
          }
          startDate = formatDated(coupon.startDate);
          expiryDate = formatDated(coupon.expiryDate);
          res.render("./coupon/editCoupon", { coupon, startDate, expiryDate });
        } catch (error) {
          next(error);
        }
      };


      const editCoupon = async (req, res, next) => {
        try {
          const couponId = req.params.couponId;
          const updatedCouponData = req.body;
          const existingCoupon = await Coupon.findById(couponId);
          console.log('existingCoupon',existingCoupon);
          if (!existingCoupon) {
            return res
              .status(404)
              .json({ success: false, message: "Coupon not found" });
          }
          existingCoupon.couponCode = updatedCouponData.couponCode;
          existingCoupon.minPurchaseAmount = updatedCouponData.minPurchaseAmount;
          existingCoupon.discountAmount = updatedCouponData.discountAmount;
          existingCoupon.startDate = updatedCouponData.startDate;
          existingCoupon.expiryDate = updatedCouponData.expiryDate;
          const updatedCoupon = await existingCoupon.save();
          console.log('updatedCoupon',updatedCoupon);
          return res.json({
            success: true,
            message: "Coupon edited successfully",
            updatedCoupon,
          });
        } catch (error) {
          console.error("Error editing coupon:", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      };


      const deletecoupon = async (req, res) => {
        try {
          const couponId = req.params.couponId;
          const deletecoupon = await Coupon.findOneAndDelete(couponId);
          if (deletecoupon) {
            return res.json({
              success: true,
              message: "Coupon deleted successfully",
            });
          } else {
            return res
              .status(404)
              .json({ success: false, message: "Coupon not found" });
          }
        } catch (error) {
          console.error("Error deleting coupon:", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      };





module.exports = {
    coupon,
    addcouponform,
    createCoupon,
    showEditCouponForm,
    editCoupon,
    deletecoupon,
}