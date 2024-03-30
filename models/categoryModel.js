const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//catagory schema
const catagorySchema = new Schema({
  name: {
    type: String,
    required: true,
},
});

const Catagory = mongoose.model("Catagory", catagorySchema);
module.exports = Catagory;