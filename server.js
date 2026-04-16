const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let orders = [];
let deliveryFee = 2000;

// Create Order

app.post("/order", (req, res) => {

const order = {

id: Date.now(),

food: req.body.food,

address: req.body.address,

status: "pending",

rider: "Not assigned",

deliveryFee: deliveryFee

};

orders.push(order);

res.json(order);

});


// Get Orders

app.get("/orders", (req, res) => {

res.json(orders);

});


// Vendor marks ready

app.post("/ready/:id", (req, res) => {

const id = Number(req.params.id);

const order = orders.find(o => o.id === id);

if(order){

order.status = "ready";

}

res.json(order);

});


// Admin assigns rider

app.post("/assign-rider/:id", (req, res) => {

const id = Number(req.params.id);

const order = orders.find(o => o.id === id);

if(order){

order.rider = req.body.rider;

order.status = "rider assigned";

}

res.json(order);

});


// Rider delivers

app.post("/deliver/:id", (req, res) => {

const id = Number(req.params.id);

const order = orders.find(o => o.id === id);

if(order){

order.status = "delivered";

}

res.json(order);

});


// Set Delivery Fee

app.post("/set-delivery-price", (req, res) => {

deliveryFee = req.body.price;

res.json({

message: "Delivery fee updated",

deliveryFee: deliveryFee

});

});


// Start Server

app.listen(3000, () => {

console.log("Foodflat server running on port 3000");

});
