const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

function generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';
    for (let i = 0; i < 6; i++) {
        referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return referralCode;
}

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
}

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

const otp1 = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash("error", "User already exists");
            return res.render("./user/signup", { error: req.flash("error") });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const referralCode = generateReferralCode();

        req.session.tempUser = {
            name,
            email,
            password: hashedPassword,
            referralCode,
        };

        const otp = generateOTP();
        const otpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes

        req.session.otpData = {
            otp,
            expiry: otpExpiry
        };

        const mailOptions = {
            to: email,
            subject: "Your OTP for Hypnosofa Registration",
            html: `<h3>Your OTP for account verification is</h3>
                   <h1 style='font-weight:bold; color:#014122;'>${otp}</h1>
                   <p>This OTP is valid for 2 minutes.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP Sent:", otp);

        res.render("./user/otp", {
            msg10: "OTP has been sent to your email!",
            email: email,
            remainingTime: 120 
        });

    } catch (error) {
        console.error("Error in otp1:", error);
        res.status(500).send("Internal Server Error");
    }
};

const verify = async (req, res) => {
    try {
        const userOTP = req.body.otp?.trim();
        const otpData = req.session.otpData;
        const tempUser = req.session.tempUser;

        if (!tempUser || !otpData) {
            return res.render("./user/otp", {
                msg10: "Session expired. Please try signing up again.",
                remainingTime: 0
            });
        }

        if (Date.now() > otpData.expiry) {
            req.session.otpData = null;
            return res.render("./user/otp", {
                msg10: "OTP has expired. Please request a new one.",
                remainingTime: 0
            });
        }

        if (userOTP !== String(otpData.otp)) {
            return res.render("./user/otp", {
                msg10: "Invalid OTP. Please try again.",
                remainingTime: Math.floor((otpData.expiry - Date.now()) / 1000)
            });
        }

        const newUser = new User({
            name: tempUser.name,
            email: tempUser.email,
            password: tempUser.password,
            referralCode: tempUser.referralCode,
        });

        const savedUser = await newUser.save();
        req.session.userId = savedUser._id;

        req.session.tempUser = null;
        req.session.otpData = null;


        const successMsg = "Welcome! Your account has been created successfully.";
        res.render("./user/login", { error1: successMsg });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).send("Internal Server Error");
    }
};

const resend = async (req, res) => {
    try {
        const tempUser = req.session.tempUser;
        if (!tempUser) {
            return res.redirect("/signup");
        }

        const newOTP = generateOTP();
        const otpExpiry = Date.now() + 2 * 60 * 1000; 

        req.session.otpData = {
            otp: newOTP,
            expiry: otpExpiry
        };

        const mailOptions = {
            to: tempUser.email,
            subject: "New OTP for Hypnosofa Registration",
            html: `<h3>Your new OTP is</h3>
                   <h1 style='font-weight:bold; color:#014122;'>${newOTP}</h1>
                   <p>Valid for 2 minutes only.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log("Resent OTP:", newOTP);

        res.render("./user/otp", {
            msg10: "New OTP sent successfully!",
            remainingTime: 120
        });

    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).send("Failed to resend OTP");
    }
};

const verifyreferralcode = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const user = await User.findOne({ referralCode });
        res.json({ valid: !!user });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = {
    otp1,
    verify,
    resend,
    verifyreferralcode
};