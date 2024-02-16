const User = require('../models/userModel');
const Address = require('../models/addressModel');
const bcrypt = require('bcrypt');






//user profile------------------------------------------------------->
const userprofile = async (req, res) => { 
    try {
        const user = req.session.user || {};
        const userId = user._id;
        const addresses = await Address.find({ userId });
        res.render('./userprofile/profile.ejs', { pageTitle: 'userprofile', user, addresses });
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



// Controller logic for handling address editing
const editAddress = (req, res) => {
    const addressId = req.params.id;
    Address.findById(addressId, (err, address) => {
        if (err) {
            console.error('Error finding address:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.render('edit-address', { address: address });
        }
    });
};

// Controller logic for updating an address
const updateAddress = (req, res) => {
    const addressId = req.params.id;
    const updatedAddress = req.body;
    Address.findByIdAndUpdate(addressId, updatedAddress, { new: true }, (err, updatedAddress) => {
        if (err) {
            console.error('Error updating address:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'Address updated successfully' });
        }
    });
};

  






module.exports = {
    userprofile,
    changepassword,
    saveAddress,
    deleteAddress,
    editAddress,
    updateAddress
   
};