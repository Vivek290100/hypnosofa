// C:\Users\vivek_laxvnt1\Desktop\Tasks\Week 7-12 Project Week\hypnosofa\controller\admincontroller.js
const User = require('../models/userModel');
const ejs = require('ejs');
const orderModels = require('../models/orderModel');
const moment = require("moment");
const fs = require("fs");
const Category = require("../models/categoryModel"); 
const path = require('path');
const html_to_pdf = require('html-pdf-node');
require('dotenv').config();



const admin = (req, res) => {
    res.render('./admin/adlog', { title: 'user login', err: false });
  };



const adhome = async (req, res) => {
    try {
      const totalOrders = await orderModels.countDocuments();
      const totalProductQuantity = await orderModels
        .aggregate([
          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: null,
              totalProductQuantity: { $sum: "$products.quantity" },
            },
          },
        ])
        .exec();

      const productQuantity = totalProductQuantity.length > 0 ? totalProductQuantity[0].totalProductQuantity : 0;
      const totalUsers = await User.countDocuments();
      const deliveredOrders = await orderModels.find({ status: "Delivered" });
      const selectedTimeInterval = req.query.interval || "daily";

      let timeFormat, timeUnit, dateFormat;
      if (selectedTimeInterval === "monthly") {
        timeFormat = "%Y-%m";
        timeUnit = "$month";
        dateFormat = "MMMM YYYY";
      } else if (selectedTimeInterval === "yearly") {
        timeFormat = "%Y";
        timeUnit = "$year";
        dateFormat = "YYYY";
      } else {
        timeFormat = "%Y-%m-%d";
        timeUnit = "$dayOfMonth";
        dateFormat = "MMMM DD, YYYY";
      }

    const ordersWithDate = await orderModels
    .aggregate([
      { $match: { _id: { $in: deliveredOrders.map(order => order._id) }, orderDate: { $exists: true } } },
      { $addFields: { orderDate: { $toDate: "$orderDate" } } },
      {
        $group: {
          _id: { $dateToString: { format: timeFormat, date: "$orderDate", timezone: "+0530" } },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, date: "$_id", count: 1 } },
      { $sort: { date: 1 } }
    ])
    .exec();

      const validOrdersWithDate = ordersWithDate.filter(
        (order) => order.date && order.date !== "null"
      );
      const xValues = validOrdersWithDate.map((order) => order.date);
      const yValues = validOrdersWithDate.map((order) => order.count);
        
      const recentlyPlacedOrders = await orderModels
    .find()
    .sort({ orderDate: -1, orderTime: -1 }) 
    .populate("products.product")
    .limit(5);

    const topSellingProduct = await orderModels
    .aggregate([
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.product",
                totalOrders: { $sum: 1 } 
            }
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 5 }
    ])
    .lookup({
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
    })
    .exec();

const topSellingCategories = await orderModels.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "productInfo"
        }
    },
    { $unwind: "$productInfo" },
    { $group: { _id: "$productInfo.category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
]).exec();

    const categoryIds = topSellingCategories.map(category => category._id);
    const categoryNames = await Category.find({ _id: { $in: categoryIds } });
    const categoriesWithNames = topSellingCategories.map(category => {
      const categoryName = categoryNames.find(name => name._id.equals(category._id));
      return {
        _id: category._id,
        name: categoryName ? categoryName.name : "Unknown", 
        count: category.count
      };
    });

      res.render("./admin/adhome", {
        title: "Admin Home",
        totalOrders,
        productQuantity,
        totalUsers,
        orders: deliveredOrders,
        xValues: JSON.stringify(xValues),
        yValues,
        recentlyPlacedOrders,
        topSellingProduct,
        topSellingCategories: categoriesWithNames,         
        selectedTimeInterval,
        dateFormat,
        err: false,
      });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).send("Internal server error");
    }
  };



const dashboard = (req, res) => {
  const credential = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD, 
  };
  const userInput = {
    email: req.body.email,
    password: req.body.password,
  };

  if (userInput.email === credential.email && userInput.password === credential.password) {
    req.session.admin = userInput.email;
    req.session.adLogged = true;
    res.redirect('/adhome');
  } else {
    const err = 'Invalid Username or Password';
    res.render('./admin/adlog', { err: err });
  }
};



  const users = async (req, res) => {
    try {
      const users = await User.find()
      res.render('./admin/userlist', {
        title: 'users',
        users,  
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Internal Server Error');
    }
  };



const block=async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (user) {
      user.status = "blocked";
      await user.save();
     return  res.redirect("/adlog");
    } else {
      return res.send("User not found");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};



const unblock=async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (user) {
      user.status = "active";
      await user.save();
      return res.redirect("/adlog");
    } else {
      return res.send("User not found");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};



const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
    } else {
      res.redirect('/admin/login'); 
    }
  });
};



const userOrder = async(req,res)=>{
  try{

    const page = req.query.page || 1;
    const pageSize = 5; 
    const skip = (page - 1) * pageSize;
    const totalOrders = await orderModels.countDocuments();
    const totalPages = Math.ceil(totalOrders / pageSize);

    const Orders = await orderModels.find().sort({ "orderDate": -1, "orderTime": -1}).skip(skip).limit(pageSize).populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price description image',
      paymentMethod: 'paymentMethod'
    })
    .exec();

    res.render('./admin/orderlist',{title: 'Orders',Orders,totalPages, currentPage: page})
  }catch (error){
    console.error('Error fetching user orders:', error);
    res.status(500).send('Internal Server Error');
  }
}


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        await orderModels.findOneAndUpdate({ _id: orderId }, { $set: { status: newStatus } });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
}

const salesReport = async (req, res) => {
  try {
    const startDate = req.query.startDate
      ? moment(req.query.startDate).startOf("day")
      : moment().startOf("day");
    const endDate = req.query.endDate
      ? moment(req.query.endDate).endOf("day")
      : moment().endOf("day");

    console.log("Searching from:", startDate.format('DD-MM-YYYY'), "to", endDate.format('DD-MM-YYYY'));

    // THIS IS THE ONLY LINE THAT MATTERS NOW
    const orders = await orderModels.find({
      status: "Delivered",
      $expr: {
        $and: [
          { $gte: [{ $dateFromString: { dateString: "$orderDate", format: "%d-%m-%Y" } }, startDate.toDate()] },
          { $lte: [{ $dateFromString: { dateString: "$orderDate", format: "%d-%m-%Y" } }, endDate.toDate()] }
        ]
      }
    })
    .populate("customer")
    .populate("products.product")
    .lean();

    console.log(`Found ${orders.length} delivered orders → NOW IT WILL SHOW 2`);

    const displayStart = startDate.format('DD-MM-YYYY') + " ";
    const displayEnd = endDate.format('DD-MM-YYYY') + " ";

    const renderedHTML = ejs.render(fs.readFileSync(path.join(__dirname, "../views/admin/salesreport.ejs"), "utf-8"), {
      startDate: displayStart,
      endDate: displayEnd,
      orders,
    });

    const pdfBuffer = await html_to_pdf.generatePdf({ content: renderedHTML }, { format: "Letter", margin: 40 });

    res.setHeader("Content-Disposition", `attachment; filename=SalesReport_${startDate.format('DD-MM-YYYY')}_to_${endDate.format('DD-MM-YYYY')}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Error: " + error.message);
  }
};



  module.exports = {
    admin,
    dashboard,
    adhome,
    users,
    block,
    unblock,
    userOrder,
    updateOrderStatus,
    logout,
    salesReport,
  }