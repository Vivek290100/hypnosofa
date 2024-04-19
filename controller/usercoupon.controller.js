const Coupon = require("../models/couponModel");
const cartModels = require("../models/cartModel");
const orderModel = require("../models/orderModel");


//coupon validation------------------------------------------------------->
const validcoupon = async (req, res) => {
  const couponCode = req.query.code;
  try {
    const userId = req.session.user._id;
    const coupon = await Coupon.findOne({ couponCode });
    const cart = await cartModels
      .findOne({ userId })
      .populate("products.productId", "name price description image");

    if (!coupon) {
      res.json({
        valid: false,
        message: "Invalid coupon code.",
      });
      return;
    }
    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
      res.json({
        valid: false,
        message: "Coupon is expired or not yet valid.",
      });
      return;
    }
    const isCouponUsed = await orderModel.exists({
      customer: userId,
      "totals.couponCode": couponCode,
      status: { $ne: "Cancelled" },
    });
    if (isCouponUsed) {
      res.json({
        valid: false,
        message: "Coupon is already used in a previous order.",
      });
      return;
    }
    const originalTotal = cart.totals.totalprice;
    const discountAmount = coupon.discountAmount;
    const discountedTotal = Math.max(originalTotal - discountAmount, 0);
    await cartModels.findOneAndUpdate(
      { userId },
      {
        $set: {
          "totals.discountAmount": discountAmount,
          "totals.discountedTotal": discountedTotal,
        },
      },
      { new: true }
    );
    res.json({
      valid: true,
      discountedTotal: discountedTotal.toFixed(2),
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};


//remove coupon------------------------------------------------------->
const removeCoupon = async (req, res) => {
  const couponCode = req.query.code;
  try {
    const userId = req.session.user._id;
    const coupon = await Coupon.findOne({ couponCode });
    if (!coupon) {
      res.status(404).json({
        error: "Coupon not found.",
      });
      return;
    }
    const cart = await cartModels
      .findOne({ userId })
      .populate("products.productId", "name price description image");
    const updatedcart = await cartModels.findOneAndUpdate(
      { userId },
      {
        $set: {
          "totals.discountAmount": 0,
          "totals.discountedTotal": cart.totals.totalprice,
        },
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Error removing discount:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};


module.exports = {
  validcoupon,
  removeCoupon,
};
