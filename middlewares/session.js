const User=require('../models/userModel')
const passport = require('passport');
const verifyUser = (req, res, next) => {
    if (req.session.logged) {
      next();
    } else {
      res.redirect("/user/login");
    }
  };
  
  const userExist = (req, res, next) => {
    if (req.session.logged) {
      return res.redirect("/");
    } else {
      next();
    }
  };
 

  const verifyAdmin = (req, res, next) => {
    if (req.session.adLogged) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  };


  const adminExist = (req, res, next) => {
    if (req.session.adLogged) {
      res.redirect("/adhome");
    } else {
      next();
    }
  };

  const verifyAdminLoggedOut = (req, res, next) => {
    if (!req.session.adLogged) {
      next();
    } else {
      res.redirect("/adhome");
    }
  };


  const checkUserStatus = async (req, res, next) => {
    if (req.isAuthenticated()) {
      try {
        const user = await User.findById(req.user._id);
        console.log("user",user);
        if (user && user.status === 'blocked') {
          req.logout();
        }
      } catch (error) {
        console.error(error);
      }
    }
    next();
  };

  const handle404 = (req, res) => {
    res.status(404).render("./user/404");
  };
  

  



  module.exports = {
    verifyUser,
    userExist,
    checkUserStatus,
    adminExist,
    verifyAdmin,
    verifyAdminLoggedOut,
    handle404
  }