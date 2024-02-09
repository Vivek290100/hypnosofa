const User = require('../models/userModel');
const ejs = require('ejs');




//admin login------------------------------------------------------->
const admin = (req, res) => {
    
    res.render('./admin/adlog', { title: 'user login', err: false });
  };

  //admin home------------------------------------------------------->
  const adhome = (req, res) => {
   
    res.render('./admin/adhome', { title: 'user login', err: false });
  };



//checking email and password of admin------------------------------------------------------->
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



//blocking user in admin side------------------------------------------------------->
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
//unblocking user in admin side------------------------------------------------------->
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


//logout------------------------------------------------------->
const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
    } else {
      res.redirect('/admin/login'); 
    }
  });
};




  module.exports = {
    admin,
    dashboard,
    adhome,
    users,
    block,
    unblock,
    logout,
  }