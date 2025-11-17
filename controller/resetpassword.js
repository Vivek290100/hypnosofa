// controller/resetpassword.js
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email');

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash('error', 'No user found with this email');
            return res.render('./user/forgot', { error: req.flash('error') });
        }

        const otp = generateOTP();
        const otpExpiry = Date.now() + 2 * 60 * 1000;

        req.session.resetPass = {
            userId: user._id,
            email: user.email,
            otp,
            expiry: otpExpiry
        };

        await sendEmail({
            to: email,
            subject: "Password Reset OTP - Hypnosofa",
            html: `<h3>Your password reset OTP is</h3>
                   <h1 style="color:#014122; font-weight:bold;">${otp}</h1>
                   <p>Valid for 2 minutes only.</p>`
        });

        res.render('./user/resetpassword', {
            email,
            errorMessage1: null,
            remainingTime: 120
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).send('Server Error');
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const sessionData = req.session.resetPass;

        if (!sessionData || sessionData.email !== email) {
            return res.render('./user/resetpassword', {
                email, errorMessage1: "Session expired. Try again.", remainingTime: 0
            });
        }

        if (Date.now() > sessionData.expiry) {
            req.session.resetPass = null;
            return res.render('./user/resetpassword', {
                email, errorMessage1: "OTP expired.", remainingTime: 0
            });
        }

        if (String(otp) !== String(sessionData.otp)) {
            return res.render('./user/resetpassword', {
                email,
                errorMessage1: "Invalid OTP.",
                remainingTime: Math.floor((sessionData.expiry - Date.now()) / 1000)
            });
        }

        const user = await User.findById(sessionData.userId);
        if (!user) return res.send("User not found");

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        req.session.resetPass = null;
        req.flash('success', 'Password reset successful! Please login.');
        res.redirect('/user/login');

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).send('Server Error');
    }
};

const otpresend = async (req, res) => {
    try {
        const sessionData = req.session.resetPass;
        if (!sessionData) return res.redirect('/forgot-password');

        const newOTP = generateOTP();
        sessionData.otp = newOTP;
        sessionData.expiry = Date.now() + 2 * 60 * 1000;
        req.session.resetPass = sessionData;

        await sendEmail({
            to: sessionData.email,
            subject: "New Password Reset OTP",
            html: `<h3>New OTP:</h3><h1 style="color:#014122;">${newOTP}</h1><p>Valid for 2 minutes.</p>`
        });

        res.render('./user/resetpassword', {
            email: sessionData.email,
            errorMessage1: "New OTP sent!",
            remainingTime: 120
        });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).send("Failed to resend");
    }
};

const showForgotPasswordForm = (req, res) => {
    res.render('./user/forgot', { error: req.flash('error') });
};

module.exports = {
    forgotPassword,
    resetPassword,
    showForgotPasswordForm,
    otpresend
};