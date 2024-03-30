const Offer = require("../models/categoryOfferModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const mongoose = require("mongoose");




function formatDated(date) {
    if (!date) return null;
  
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }


const CategoryOffers = async (req, res) => {
  try {
    const categories = await Category.find();
    const categoryData = [];
    const searchQuery = req.query.search || "";
    for (const category of categories) {
      const productCount = await Product.countDocuments({
        category: category._id,
      });
      const offer = await Offer.findOne({ category: category._id }).populate(
        "category"
      );
      const offerPercentage = offer ? offer.discountPercentage : 0;
      const expiryDate = offer ? formatDated(offer.expiryDate) : null;
      const startDate = offer ? formatDated(offer.startDate) : null;
      
      

      if (
        searchQuery &&
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        categoryData.push({
          categoryid: category._id,
          category: category.name,
          productCount,
          offerPercentage,
          startDate,
          expiryDate,
        });
      } else if (!searchQuery) {
        categoryData.push({
          categoryid: category._id,
          category: category.name,
          productCount,
          offerPercentage,
          startDate,
          expiryDate,
        });
      }
    }
    res.render("categoryoffer/categoryoffer", {
      categoryData: categoryData 
    });
  } catch (error) {
    console.error("Error fetching category offers data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
//Edit offers------------------------------------------------------->
const editOffer = async (req, res) => {
  try {
      const { categoryId, offerPercentage, startDate, expiryDate } = req.body;

      // Find the existing category
      const existingCategory = await Category.findById(categoryId);
      if (!existingCategory) {
          return res.status(404).json({ success: false, message: "Category not found" });
      }

      // Create or update the offer
      let offer = await Offer.findOne({ category: categoryId });
      if (!offer) {
          offer = new Offer({ category: categoryId });
      }

      offer.discountPercentage = offerPercentage;
      offer.startDate = startDate;
      offer.expiryDate = expiryDate;
      await offer.save();



      res.status(200).json({ success: true, message: "Category offer updated successfully" });
  } catch (error) {
      console.error("Error updating category offer:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



//Delete offer------------------------------------------------------->
const deleteOffer = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const deletedOffer = await Offer.findOneAndDelete({ category: categoryId });
    if (deletedOffer) {
      const products = await Product.find({ category: categoryId });
      for (const product of products) {
        product.Offerprice = null;
        await product.save();
      }
      return res.json({ success: true, message: "Offer deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
//module exports------------------------------------------------------->
module.exports = {
  CategoryOffers,
  editOffer,
  deleteOffer,
};