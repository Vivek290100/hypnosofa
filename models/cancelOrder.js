
const mongoose = require('mongoose');

// Define the CanceledOrder schema
const canceledOrderSchema = new mongoose.Schema({
    orderID: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    canceledAt: {
        type: Date,
        default: Date.now,
    },
});

const CanceledOrder = mongoose.model('CanceledOrder', canceledOrderSchema);

module.exports = CanceledOrder;
