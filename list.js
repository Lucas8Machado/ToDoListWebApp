const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
    name: String,
    items: [listSchema],
});

const List = mongoose.model("List", listSchema);

module.exports = List;