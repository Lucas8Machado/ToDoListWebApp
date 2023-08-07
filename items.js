const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
    name: String
})

module.exports = mongoose.model("items", listSchema);
