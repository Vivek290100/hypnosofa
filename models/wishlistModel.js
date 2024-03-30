const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId },
    productId:{type: mongoose.Types.ObjectId} ,
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;