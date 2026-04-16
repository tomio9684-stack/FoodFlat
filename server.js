const express = require(“express”);
const cors = require(“cors”);
const multer = require(“multer”);
const path = require(“path”);
const fs = require(“fs”);

const app = express();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, “public”, “uploads”);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, uploadDir),
filename: (req, file, cb) => {
const unique = Date.now() + “-” + Math.round(Math.random() * 1e6);
cb(null, unique + path.extname(file.originalname));
}
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.static(“public”));

// ── DATA ──
let orders = [];
let deliveryPrice = 800;
let vendors = [
{
id: 1,
name: “Mama T Amala”,
emoji: “🍲”,
image: null,
rating: 4.6,
time: “25 mins”,
active: true,
foods: [
{ id: 1, name: “Amala & Ewedu”, price: 1500, image: null },
{ id: 2, name: “Pounded Yam & Egusi”, price: 2000, image: null },
{ id: 3, name: “Pepper Soup”, price: 1800, image: null }
]
},
{
id: 2,
name: “Sodiq Shawarma”,
emoji: “🌯”,
image: null,
rating: 4.4,
time: “20 mins”,
active: true,
foods: [
{ id: 1, name: “Chicken Shawarma”, price: 2000, image: null },
{ id: 2, name: “Beef Shawarma”, price: 2200, image: null },
{ id: 3, name: “Mini Shawarma”, price: 1200, image: null }
]
},
{
id: 3,
name: “Chicken Republic”,
emoji: “🍗”,
image: null,
rating: 4.5,
time: “30 mins”,
active: true,
foods: [
{ id: 1, name: “Grilled Chicken & Chips”, price: 2800, image: null },
{ id: 2, name: “Full Chicken”, price: 4500, image: null },
{ id: 3, name: “Chicken Burger”, price: 2200, image: null }
]
}
];
let nextVendorId = 4;

// ── VENDORS ──
app.get(”/vendors”, (req, res) => res.json(vendors));

app.post(”/vendors”, upload.single(“image”), (req, res) => {
const { name, emoji, rating, time } = req.body;
const vendor = {
id: nextVendorId++,
name, emoji: emoji || “🍽️”,
image: req.file ? “/uploads/” + req.file.filename : null,
rating: parseFloat(rating) || 4.0,
time: time || “30 mins”,
active: true,
foods: []
};
vendors.push(vendor);
res.json(vendor);
});

app.put(”/vendors/:id”, upload.single(“image”), (req, res) => {
const id = Number(req.params.id);
const v = vendors.find(x => x.id === id);
if (!v) return res.status(404).json({ error: “Not found” });
const { name, emoji, rating, time, active } = req.body;
if (name) v.name = name;
if (emoji) v.emoji = emoji;
if (rating) v.rating = parseFloat(rating);
if (time) v.time = time;
if (active !== undefined) v.active = active === “true”;
if (req.file) v.image = “/uploads/” + req.file.filename;
res.json(v);
});

app.delete(”/vendors/:id”, (req, res) => {
const id = Number(req.params.id);
vendors = vendors.filter(v => v.id !== id);
res.json({ success: true });
});

// ── FOOD ITEMS ──
app.post(”/vendors/:id/foods”, upload.single(“image”), (req, res) => {
const id = Number(req.params.id);
const v = vendors.find(x => x.id === id);
if (!v) return res.status(404).json({ error: “Not found” });
const food = {
id: Date.now(),
name: req.body.name,
price: Number(req.body.price),
image: req.file ? “/uploads/” + req.file.filename : null
};
v.foods.push(food);
res.json(food);
});

app.put(”/vendors/:vid/foods/:fid”, upload.single(“image”), (req, res) => {
const v = vendors.find(x => x.id === Number(req.params.vid));
if (!v) return res.status(404).json({ error: “Not found” });
const food = v.foods.find(f => f.id === Number(req.params.fid));
if (!food) return res.status(404).json({ error: “Not found” });
if (req.body.name) food.name = req.body.name;
if (req.body.price) food.price = Number(req.body.price);
if (req.file) food.image = “/uploads/” + req.file.filename;
res.json(food);
});

app.delete(”/vendors/:vid/foods/:fid”, (req, res) => {
const v = vendors.find(x => x.id === Number(req.params.vid));
if (!v) return res.status(404).json({ error: “Not found” });
v.foods = v.foods.filter(f => f.id !== Number(req.params.fid));
res.json({ success: true });
});

// ── ORDERS ──
app.post(”/order”, (req, res) => {
const foodPrice = Number(req.body.foodPrice) || 0;
const order = {
id: Date.now(),
food: req.body.food,
foodImage: req.body.foodImage || null,
vendorName: req.body.vendorName || “”,
address: req.body.address,
foodPrice,
deliveryFee: deliveryPrice,
total: foodPrice + deliveryPrice,
status: “pending”,
rider: “Not assigned”
};
orders.push(order);
res.json(order);
});

app.get(”/orders”, (req, res) => res.json(orders));

app.post(”/assign-rider/:id”, (req, res) => {
const order = orders.find(o => o.id === Number(req.params.id));
if (!order) return res.status(404).json({ error: “Not found” });
order.rider = req.body.rider;
order.status = “rider assigned”;
res.json(order);
});

app.post(”/ready/:id”, (req, res) => {
const order = orders.find(o => o.id === Number(req.params.id));
if (!order) return res.status(404).json({ error: “Not found” });
order.status = “ready”;
res.json(order);
});

app.post(”/deliver/:id”, (req, res) => {
const order = orders.find(o => o.id === Number(req.params.id));
if (!order) return res.status(404).json({ error: “Not found” });
order.status = “delivered”;
res.json(order);
});

app.post(”/set-delivery-price”, (req, res) => {
deliveryPrice = Number(req.body.price);
res.json({ message: “Updated”, price: deliveryPrice });
});

app.get(”/delivery-price”, (req, res) => res.json({ price: deliveryPrice }));

app.listen(3000, () => console.log(“Foodflat running on http://localhost:3000”));
