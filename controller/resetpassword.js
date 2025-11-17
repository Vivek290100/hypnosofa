const nodemailer = require("nodemailer");
const User = require('../models/userModel');
const bcrypt = require('bcrypt');


//nodemailer to send otp-----------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
    connectionTimeout: 60000,
    socketTimeout: 60000,
});


//generate otp------------
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
}
const otp1 = generateOTP();
//otp for user email-------------------
const sendOTP = async (email, otp) => {
    const mailOptions = {
        to: email,
        subject: "Otp for password reset is: ",
        html: "<h3>OTP for password reset is </h3>" + "<h1 style='font-weight:bold;'>" + otp1 + "</h1>"
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
};
//password for forgot password--------------
const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            req.flash('error', 'No user found with this email');
            return res.render('./user/forgot', { error: req.flash('error') });
        }
        req.session.user = {
            name: req.body.name,
            email: email,
            password: req.body.password
        };
        req.session.otp = otp1
        await sendOTP(email,otp1);
        res.render('./user/resetpassword', { email, otp1, errorMessage1:null});
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).send('Internal Server Error');
    }
};
//check the otp --------------------------
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const userOTP = req.body.otp;
       console.log(userOTP);
       console.log(otp1);
        if (userOTP != otp1) {
            const errorMessage1 = 'Invalid OTP Or Expired OTP. Please try again.';
            req.flash('error', errorMessage1);
            return res.render('./user/resetpassword', { email, otp1, errorMessage1 });
        }
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'User not found.');
            return res.send("invalid user");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordOTP = null;
        await user.save();
        if (req.session.logged==true) {
            req.session.user=user
            return res.redirect('/user/profile');
        } else {
            return res.redirect('/user/login');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        req.flash('error', 'Internal Server Error');
        return res.status(500).render('error', { error: req.flash('error') });
    }
};


//to get the email id of the user for resend----------------------
const showForgotPasswordForm = (req, res) => {
    console.log(req.body);
    res.render('./user/forgot', { error: req.flash('error') });
};
//otp resend-------------------------------------------------------
const otpresend = function (req, res) {
    const email = req.session.user && req.session.user.email;
    console.log(email);
    const storedOTP = req.session.otp;
    const mailOptions = {
        to: email,
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" +storedOTP + "</h1>" 
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('./user/resetpassword', { email: email, errorMessage1: "OTP has been sent" });
    });
};


module.exports = {
    forgotPassword,
    resetPassword,
    showForgotPasswordForm,
    otpresend
};