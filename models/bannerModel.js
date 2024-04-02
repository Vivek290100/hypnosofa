const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    }
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
