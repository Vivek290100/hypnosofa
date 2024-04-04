const User = require('../models/userModel');
const Address = require('../models/addressModel');
const bcrypt = require('bcrypt');
const Wallet=require('../models/walletModel')







//user profile------------------------------------------------------->
const userprofile = async (req, res) => { 
    try {
        const user = req.session.user || {};
    
        // console.log(user,'userrrrrrrrrrrrrrrrrrrrrrr');
        const userId = user._id;
        const addresses = await Address.find({ userId });

        // const amount = await Wallet.findOne(userId, {balance:balance});
        // console.log('amount',amount);
        const wallet = await Wallet.findOne({ user: user._id });
        const walletBalance = wallet ? wallet.balance : 0;
        
        const amount =  walletBalance; 

        const userWithReferralCode = await User.findById(userId);
        const referralCode = userWithReferralCode.referralCode;
        

        res.render('./userprofile/profile.ejs', { pageTitle: 'userprofile', user, addresses,amount,referralCode });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Define the route for changing the password
const changepassword = async (req, res) => {
    const userId = req.session.user._id;
    
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid current password' });
        }

        const newPassword = req.body.newPassword;
        const repeatNewPassword = req.body.repeatNewPassword;
        console.log('newPassword',newPassword);
        console.log('repeatNewPassword',repeatNewPassword);
        if (newPassword !== repeatNewPassword) {
            return res.status(400).json({ error: 'New password and repeat password do not match' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        req.session.destroy();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password. Please try again later.' });
    }
};



//Address controll
const saveAddress = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user._id;
            console.log("userid", userId);
            const user = await User.findById(userId);
            console.log("user n", user);
            if (!user) {
                return res.status(404).send('User not found');
            }

            const { name, mobile, email, pincode, houseName, locality, city, district, state } = req.body;
            const newAddress = new Address({
                userId: user._id,
                name,
                mobile,
                email,
                pincode,
                houseName,
                locality,
                city,
                district,
                state,
            });

            await newAddress.save();

            user.addresses = user.addresses || [];
            user.addresses.push(newAddress._id);
            await user.save();

            // Update the session with the user object
            req.session.user = user;

            return res.redirect('/user/address');
        } else {
            return res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};





//delete address 

const deleteAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      await Address.findByIdAndDelete(addressId);
      const userId = req.session.user._id;
      await User.findByIdAndUpdate(userId, { $pull: { addresses: addressId } });
      res.redirect('/user/profile');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };




  

const saveUser = async (req, res) => {
    try {
        // Check if req.user is defined and has the id property
        if (!req.session.user._id) {
            throw new Error('User ID not found in request');
        }

        const userId = req.session.user._id;
        console.log('userId......',userId);
        const newName = req.body.name;
        console.log('newname',newName);

        // Update the user's name in the database
        await User.findByIdAndUpdate(userId, { name: newName });
        req.session.user.name=newName
        res.redirect('user/profile')

        // res.status(200).json({ success: true, message: 'User name updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'An error occurred while updating the user name' });
    }
};


// Route to handle AJAX request for fetching address details

// router.get('/edit-address/:id',
const editaddress= async(req, res) => {
    try {
        const user = req.session.user
        console.log("user",user);
        const addressId = req.params.id;
        console.log("addressiddd",addressId);
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).send('Address not found');
        }
        res.render('userprofile/editaddress', { address,user });
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateAddress = async (req, res) => {
    try {
        const { mobile, pincode, houseName, locality, city, district, state } = req.body;
        // Assuming addressId is available in req.params or req.body, depending on your route configuration
        const addressId = req.params.addressId;
        // console.log("update",addressId);

        // Find the address by ID
        let address = await Address.findById(addressId);

        // Update the address fields
        address.mobile = mobile;
        address.pincode = pincode;
        address.houseName = houseName;
        address.locality = locality;
        address.city = city;
        address.district = district;
        address.state = state;

        // Save the updated address
        await address.save();
        res.redirect('/user/profile')
        // res.status(200).json({ success: true, message: 'Address updated successfully' });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const walletHistory = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user._id;

        // Assuming walletHistory is an array of transactions
        const walletHistory = await Wallet.find({ user: userId }).populate('user');

        // Assuming balance is fetched from somewhere
        const balance = 0; // Fetch balance here

        res.render('./user/walletHistory', { user, walletHistory, balance });
    } catch (error) {
        console.error('Error fetching wallet history:', error);
        res.status(500).send('Internal Server Error');
    }
}








module.exports = {
    userprofile,
    changepassword,
    saveAddress,
    deleteAddress,
    saveUser,
    editaddress,
    updateAddress,
    walletHistory
   
};