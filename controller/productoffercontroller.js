const Product = require("../models/productModel");
const ProductOffer = require("../models/productOfferModel");
const flash = require('connect-flash');


function formatDated(date) {
    if (!date) return null;
  
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }


const ProductOffers = async (req, res) => {
  try {
    const products = await Product.find();
    const productData = [];
    const searchQuery = req.query.search || "";
    for (const product of products) {
      const productOffer = await ProductOffer.findOne({
        product: product._id,
      }).populate("product");
      const offerPercentage = productOffer
        ? productOffer.discountPercentage
        : 0;
      const expiryDate = productOffer
        ? formatDated(productOffer.expiryDate)
        : null;
      const startDate = productOffer
        ? formatDated(productOffer.startDate)
        : null;

      if (
        searchQuery &&
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        productData.push({
          productId: product._id,
          productName: product.name,
          offerPercentage,
          startDate,
          expiryDate,
        });
      } else if (!searchQuery) {
        productData.push({
          productId: product._id,
          productName: product.name,
          offerPercentage,
          startDate,
          expiryDate,
        });
      }
    }
    
    res.render("./productoffer/productoffer", {
      products:productData
    });
  } catch (error) {
    console.error("Error fetching product offers data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const editProductOffer = async (req, res) => {
  try {
    const { productId, percentage, startDate, expiryDate } = req.params;
    console.log({ productId, percentage, startDate, expiryDate });

    if (typeof productId !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID type" });
    }

    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const parsedPercentage = parseFloat(percentage);

    // Assuming you have a ProductOffer model with a reference to the product
    const updatedProductOffer = await ProductOffer.findOneAndUpdate(
      { product: existingProduct._id },
      { $set: { discountPercentage: parsedPercentage, startDate, expiryDate } },
      { new: true, upsert: true }
    );

    // Assuming you have a field named 'offerPrice' in your product model
    const offerPrice =
      existingProduct.price - (existingProduct.price * parsedPercentage) / 100;
    existingProduct.productOfferprice = offerPrice;

    await existingProduct.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Product offer details and product price updated successfully",
        productOffer: updatedProductOffer,
      });
  } catch (error) {
    console.error("Error updating product offer:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const deleteProductOffer = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('productId',productId);
    const deletedProductOffer = await ProductOffer.findOneAndDelete({
      product: productId,
    });
    console.log('deletedProductOffer',deletedProductOffer);

    if (deletedProductOffer) {
      const product = await Product.findById(productId);

      // Assuming you have a field named 'Offerprice' in your product model
      product.productOfferprice = null;

      await product.save();

      return res.json({
        success: true,
        message: "Product offer deleted successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product offer not found" });
    }
  } catch (error) {
    console.error("Error deleting product offer:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  ProductOffers,
  editProductOffer,
  deleteProductOffer,
};
