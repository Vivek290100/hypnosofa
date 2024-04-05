const User = require('../models/userModel');
const ejs = require('ejs');
const orderModels = require('../models/orderModel');
const moment = require("moment");
const fs = require("fs");
const puppeteer = require("puppeteer");
const Banner = require('../models/bannerModel');










//admin login------------------------------------------------------->
const admin = (req, res) => {

  
    
    res.render('./admin/adlog', { title: 'user login', err: false });
  };

  //admin home------------------------------------------------------->
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

        // console.log('totalProductQuantity',totalProductQuantity);

      const productQuantity =
        totalProductQuantity.length > 0
          ? totalProductQuantity[0].totalProductQuantity
          : 0;

        // console.log('productQuantity',productQuantity);

      const totalUsers = await User.countDocuments();
      const deliveredOrders = await orderModels.find({ status: "Delivered" });
      // console.log('orderswswswsws',deliveredOrders); 
      const selectedTimeInterval = req.query.interval || "daily";
      // console.log('selectedTimeInterval',selectedTimeInterval);
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
     // Aggregate delivered orders based on time interval
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

        // console.log('ordersWithDate',ordersWithDate);
      const validOrdersWithDate = ordersWithDate.filter(
        (order) => order.date && order.date !== "null"
      );
      // console.log('validOrdersWithDate',validOrdersWithDate);
      const xValues = validOrdersWithDate.map((order) => order.date);
      const yValues = validOrdersWithDate.map((order) => order.count);
      // console.log('xValues',xValues);
      // console.log('yValues',yValues);


        
      const recentlyPlacedOrders = await orderModels
    .find()
    .sort({ orderDate: -1, orderTime: -1 }) 
    .populate("products.product")
    .limit(5);

        // console.log('recentlyPlacedOrders',recentlyPlacedOrders);
      res.render("./admin/adhome", {
        title: "Admin Home",
        totalOrders,
        productQuantity,
        totalUsers,
        orders: deliveredOrders,
        xValues: JSON.stringify(xValues),
        yValues,
        recentlyPlacedOrders,
        selectedTimeInterval,
        dateFormat,
        err: false,
      });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).send("Internal server error");
    }
  };



//checking email and password------------------------------------------------------>
const dashboard = (req, res) => {
    const credential = {
      email: 'admin@gmail.com',
      password: 1,
    };
    const userInput = {
      email: req.body.email,
      password: parseInt(req.body.password),
    };
    // console.log(userInput)
    // console.log(credential)
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



//blocking user i------------------------------------------------------->
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
//unblocking user------------------------------------------------>
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


//logout------------------------------------------------->
const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
    } else {
      res.redirect('/admin/login'); 
    }
  });
};


//order list -------------------------------------------
const userOrder = async(req,res)=>{
  try{

    const page = req.query.page || 1; // Get page number from query parameters
    const pageSize = 5; // Number of orders per page
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

    // console.log('Orders', Orders);

    res.render('./admin/orderlist',{title: 'Orders',Orders,totalPages, currentPage: page})
  }catch (error){
    console.error('Error fetching user orders:', error);
    res.status(500).send('Internal Server Error');
  }
}


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        // Update the status of the order
        await orderModels.findOneAndUpdate({ _id: orderId }, { $set: { status: newStatus } });
        // res.json({ success: true });
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
      console.log('startDate',startDate);
      console.log('endDate',endDate);
      const formattedStartDate = moment(startDate).format('DD-MM-YYYY');
      const formattedEndDate = moment(endDate).format('DD-MM-YYYY');
    
      const orders = await orderModels.find({
        orderDate: {
          $gte: formattedStartDate,
          $lte: formattedEndDate,
        },
        status: "Delivered",
      })
      .populate({
        path: "products.product",
        match: { status: "Delivered" }
      })
      .populate("customer products.product");
      

        

      // console.log('orders',orders);
      // console.log('orderDate',orderDate);
      // console.log('orderModels schema:', orderModels.schema.obj);

    const formattedStartDate1 = startDate.format("DD-MM-YYYY ");
    const formattedEndDate1 = endDate.format("DD-MM-YYYY ");

    // console.log('formattedStartDate',formattedStartDate);
    // console.log('formattedEndDate',formattedEndDate);

    const templatePath = "views/admin/salesreport.ejs";
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const renderedHTML = ejs.render(templateContent, {
      startDate: formattedStartDate1,
      endDate: formattedEndDate1,
      orders,
    });
    // console.log('templatePath',templatePath);
    // console.log('templateContent',templateContent);
    // console.log('renderedHTML',renderedHTML);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(renderedHTML);

    const pdfBuffer = await page.pdf({ format: "Letter" });

    await browser.close();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SalesReport_${formattedStartDate}_to_${formattedEndDate}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating sales report:", error.message);
    res.status(500).send(`Internal server error: ${error.message}`);
  }
};



const banner = async(req,res)=>{
  res.render('./admin/banner')
}

const createBanner = async (req, res) => {
  try {
      const { imageUrl, caption, link } = req.body;
      const banner = new Banner({ imageUrl, caption, link });
      await banner.save();
      res.status(201).json({ message: 'Banner created successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller to update a banner
const updateBanner = async (req, res) => {
  try {
      const { id } = req.params;
      const { imageUrl, caption, link } = req.body;
      await Banner.findByIdAndUpdate(id, { imageUrl, caption, link });
      res.status(200).json({ message: 'Banner updated successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller to delete a banner
const deleteBanner = async (req, res) => {
  try {
      const { id } = req.params;
      await Banner.findByIdAndDelete(id);
      res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
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
    banner,
    createBanner,
    updateBanner,
    deleteBanner
  }