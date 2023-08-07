//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
(async () => {
  try {
    await mongoose.connect("mongodb+srv://LucasM:c1knbRPEa0eRwLcx@cluster0.eorhtdd.mongodb.net/todolistDB?retryWrites=true&w=majority");
    console.log("Connected to MongoDB");
    await run();
  } catch (error) {
    console.error("Error connecting to MongoDB Server:", error);
  }
})();

// Create a schema for the items in the todo list
const itemSchema = new mongoose.Schema({
  name: String
});

// Create a model for the items collection
const Item = mongoose.model("Item", itemSchema);

// Default items to be added to a new list
const defaultItems = [
  { name: "Welcome to your todolist!" },
  { name: "Hit the + button to add a new item." },
  { name: "<-- Hit this to delete an item." }
];

// Function to insert default items to the database if they don't exist
async function run() {
  try {
    const count = await Item.countDocuments();
    if (count === 0) {
      await Item.insertMany(defaultItems);
      console.log("Default items added to the database.");
    }
  } catch (e) {
    console.log(e.message);
  }
}

// Create a schema for custom lists
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

// Create a model for the custom lists collection
const List = mongoose.model("List", listSchema);

// Home route to show the default todo list
app.get("/", async function (req, res) {
  try {
    const fetchedItems = await Item.find({});
    res.render("list", { listTitle: "Today", newListItems: fetchedItems });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).send("Error fetching items from the database.");
  }
});

// Custom list route
app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName }).exec();

    if (foundList) {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    } else {
      const newList = new List({
        name: customListName,
        items: defaultItems
      });
      await newList.save();
      res.redirect("/" + customListName);
    }
  } catch (err) {
    console.log(err);
    res.send("An error occurred while searching for the list.");
  }
});

// Handle adding new items to the list
app.post("/", async function (req, res) {
  const listName = req.body.list;

  const newItem = new Item({
    name: req.body.newItem
  });

  if (listName === "Today") {
    await newItem.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName }).exec();
      foundList.items.push(newItem);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      console.log(err);
      res.send("An error occurred while updating the list.");
    }
  }
});

// Handle deleting items from the list
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findOneAndDelete({ _id: checkedItemId })
      .exec()
      .then(() => {
        console.log("Item deleted successfully!");
        res.redirect("/"); // Redirect to the homepage after deletion.
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error deleting item from the database.");
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).exec()
      .then(() => {
        console.log("Item deleted successfully!");
        res.redirect("/" + listName); // Redirect to the homepage after deletion.
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error deleting item from the database.");
      });
  }

});

// About route
app.get("/about", function (req, res) {
  res.render("about");
});

// Start the server
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
