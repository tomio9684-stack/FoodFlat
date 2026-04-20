const express = require(“express”);
const cors = require(“cors”);
const multer = require(“multer”);
const path = require(“path”);
const fs = require(“fs”);

const app = express();
const uploadDir = path.join(__dirname, “public”, “uploads”);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, uploadDir),
filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static(“public”));

let orders = [];
let deliveryPrice = 800;
let vendors = [
{ id:1, name:“Mama T Amala”, emoji:“🍲”, image:null, rating:4.6, time:“25 mins”, active:true, foods:[
{ id:1, name:“Amala & Ewedu”, price:1500, image:null },
{ id:2, name:“Pounded Yam & Egusi”, price:2000, image:null }
]},
{ id:2, name:“Sodiq Shawarma”, emoji:“🌯”, image:null, rating:4.4, time:“20 mins”, active:true, foods:[
{ id:1, name:“Chicken Shawarma”, price:2000, image:null },
{ id:2, name:“Beef Shawarma”, price:2200, image:null }
]},
{ id:3, name:“Chicken Republic”, emoji:“🍗”, image:null, rating:4.5, time:“30 mins”, active:true, foods:[
{ id:1, name:“Grilled Chicken & Chips”, price:2800, image:null },
{ id:2, name:“Full Chicken”, price:4500, image:null }
]}
];
let nextVendorId = 4;

// ── VENDORS ──
app.get(”/vendors”, (req, res) => res.json(vendors));

app.post(”/vendors”, upload.single(“image”), (req, res) => {
const v = {
id: nextVendorId++,
name: req.body.name,
emoji: req.body.emoji || “🍽️”,
image: req.file ? “/uploads/” + req.file.filename : null,
rating: parseFloat(req.body.rating) || 4.0,
time: req.body.time || “30 mins”,
active: true,
foods: []
};
vendors.push(v);
res.json(v);
});

app.put(”/vendors/:id”, upload.single(“image”), (req, res) => {
const v = vendors.find(x => x.id === Number(req.params.id));
if (!v) return res.status(404).json({ error: “Not found” });
if (req.body.name) v.name = req.body.name;
if (req.body.emoji) v.emoji = req.body.emoji;
if (req.body.rating) v.rating = parseFloat(req.body.rating);
if (req.body.time) v.time = req.body.time;
if (req.file) v.image = “/uploads/” + req.file.filename;
res.json(v);
});

app.delete(”/vendors/:id”, (req, res) => {
vendors = vendors.filter(v => v.id !== Number(req.params.id));
res.json({ success: true });
});

app.post(”/vendors/:id/foods”, upload.single(“image”), (req, res) => {
const v = vendors.find(x => x.id === Number(req.params.id));
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
const f = v.foods.find(x => x.id === Number(req.params.fid));
if (!f) return res.status(404).json({ error: “Not found” });
if (req.body.name) f.name = req.body.name;
if (req.body.price) f.price = Number(req.body.price);
if (req.file) f.image = “/uploads/” + req.file.filename;
res.json(f);
});

app.delete(”/vendors/:vid/foods/:fid”, (req, res) => {
const v = vendors.find(x => x.id === Number(req.params.vid));
if (!v) return res.status(404).json({ error: “Not found” });
v.foods = v.foods.filter(f => f.id !== Number(req.params.fid));
res.json({ success: true });
});

// ── ORDERS ──
// Step 1: Customer places order — status: “pending”, no rider, no fee yet
app.post(”/order”, (req, res) => {
const order = {
id: Date.now(),
food: req.body.food,
address: req.body.address,
vendorName: req.body.vendorName || “”,
foodPrice: Number(req.body.foodPrice) || 0,
deliveryFee: null,      // set by admin
total: null,            // calculated after admin sets fee
rider: null,            // assigned by admin
status: “pending”,      // pending → assigned → paid → ready → delivered
paid: false
};
orders.push(order);
res.json(order);
});

app.get(”/orders”, (req, res) => res.json(orders));

// Step 2: Admin assigns rider AND delivery fee
app.post(”/assign-rider/:id”, (req, res) => {
const o = orders.find(x => x.id === Number(req.params.id));
if (!o) return res.status(404).json({ error: “Not found” });
o.rider = req.body.rider;
o.deliveryFee = Number(req.body.deliveryFee) || deliveryPrice;
o.total = o.foodPrice + o.deliveryFee;
o.status = “assigned”; // customer can now see total and pay
res.json(o);
});

// Step 3: Customer pays
app.post(”/pay/:id”, (req, res) => {
const o = orders.find(x => x.id === Number(req.params.id));
if (!o) return res.status(404).json({ error: “Not found” });
if (o.status !== “assigned”) return res.status(400).json({ error: “Not ready for payment” });
o.paid = true;
o.status = “paid”; // vendor can now prepare
res.json(o);
});

// Step 4: Vendor marks ready
app.post(”/ready/:id”, (req, res) => {
const o = orders.find(x => x.id === Number(req.params.id));
if (!o) return res.status(404).json({ error: “Not found” });
o.status = “ready”; // rider can now pick up
res.json(o);
});

// Step 5: Rider delivers
app.post(”/deliver/:id”, (req, res) => {
const o = orders.find(x => x.id === Number(req.params.id));
if (!o) return res.status(404).json({ error: “Not found” });
o.status = “delivered”;
res.json(o);
});

// Admin sets default delivery price
app.post(”/set-delivery-price”, (req, res) => {
deliveryPrice = Number(req.body.price);
res.json({ price: deliveryPrice });
});

app.get(”/delivery-price”, (req, res) => res.json({ price: deliveryPrice }));

const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Foodflat running on port " + PORT));

