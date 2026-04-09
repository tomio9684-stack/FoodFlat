const express = require(“express”);
const cors = require(“cors”);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(“public”));

let orders = [];
let deliveryPrice = 800;

// Create order
app.post(”/order”, (req, res) => {
const foodPrice = Number(req.body.foodPrice) || 0;
const order = {
id: Date.now(),
food: req.body.food,
address: req.body.address,
foodPrice: foodPrice,
deliveryFee: deliveryPrice,
total: foodPrice + deliveryPrice,
status: “pending”,
rider: “Not assigned”
};
orders.push(order);
res.json(order);
});

// Get orders
app.get(”/orders”, (req, res) => {
res.json(orders);
});

// Assign rider
app.post(”/assign-rider/:id”, (req, res) => {
const id = Number(req.params.id);
const order = orders.find(o => o.id === id);
if (!order) return res.status(404).json({ error: “Order not found” });
order.rider = req.body.rider;
order.status = “rider assigned”;
res.json(order);
});

// Vendor marks ready
app.post(”/ready/:id”, (req, res) => {
const id = Number(req.params.id);
const order = orders.find(o => o.id === id);
if (!order) return res.status(404).json({ error: “Order not found” });
order.status = “ready”;
res.json(order);
});

// Rider delivers
app.post(”/deliver/:id”, (req, res) => {
const id = Number(req.params.id);
const order = orders.find(o => o.id === id);
if (!order) return res.status(404).json({ error: “Order not found” });
order.status = “delivered”;
res.json(order);
});

// Admin sets delivery price
app.post(”/set-delivery-price”, (req, res) => {
deliveryPrice = Number(req.body.price);
res.json({ message: “Delivery price updated”, price: deliveryPrice });
});

app.listen(3000, () => {
console.log(“Foodflat running on http://localhost:3000”);
});
