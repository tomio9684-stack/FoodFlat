const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let orders = [];
let deliveryPrice = 800;
let vendors = [
  { id:1, name:"Mama T Amala", emoji:"🍲", image:null, rating:4.6, time:"25 mins", active:true, foods:[
    { id:1, name:"Amala & Ewedu", price:1500, image:null },
    { id:2, name:"Pounded Yam & Egusi", price:2000, image:null }
  ]},
  { id:2, name:"Sodiq Shawarma", emoji:"🌯", image:null, rating:4.4, time:"20 mins", active:true, foods:[
    { id:1, name:"Chicken Shawarma", price:2000, image:null },
    { id:2, name:"Beef Shawarma", price:2200, image:null }
  ]},
  { id:3, name:"Chicken Republic", emoji:"🍗", image:null, rating:4.5, time:"30 mins", active:true, foods:[
    { id:1, name:"Grilled Chicken & Chips", price:2800, image:null },
    { id:2, name:"Full Chicken", price:4500, image:null }
  ]}
];
let nextVendorId = 4;

app.get("/vendors", (req, res) => res.json(vendors));

app.post("/vendors", upload.single("image"), (req, res) => {
  const v = { id:nextVendorId++, name:req.body.name, emoji:req.body.emoji||"🍽️", image:req.file?"/uploads/"+req.file.filename:null, rating:parseFloat(req.body.rating)||4.0, time:req.body.time||"30 mins", active:true, foods:[] };
  vendors.push(v);
  res.json(v);
});

app.put("/vendors/:id", upload.single("image"), (req, res) => {
  const v = vendors.find(x => x.id === Number(req.params.id));
  if (!v) return res.status(404).json({ error:"Not found" });
  if (req.body.name) v.name = req.body.name;
  if (req.body.emoji) v.emoji = req.body.emoji;
  if (req.body.rating) v.rating = parseFloat(req.body.rating);
  if (req.body.time) v.time = req.body.time;
  if (req.file) v.image = "/uploads/" + req.file.filename;
  res.json(v);
});

app.delete("/vendors/:id", (req, res) => {
  vendors = vendors.filter(v => v.id !== Number(req.params.id));
  res.json({ success:true });
});

app.post("/vendors/:id/foods", upload.single("image"), (req, res) => {
  const v = vendors.find(x => x.id === Number(req.params.id));
  if (!v) return res.status(404).json({ error:"Not found" });
  const food = { id:Date.now(), name:req.body.name, price:Number(req.body.price), image:req.file?"/uploads/"+req.file.filename:null };
  v.foods.push(food);
  res.json(food);
});

app.put("/vendors/:vid/foods/:fid", upload.single("image"), (req, res) => {
  const v = vendors.find(x => x.id === Number(req.params.vid));
  if (!v) return res.status(404).json({ error:"Not found" });
  const f = v.foods.find(x => x.id === Number(req.params.fid));
  if (!f) return res.status(404).json({ error:"Not found" });
  if (req.body.name) f.name = req.body.name;
  if (req.body.price) f.price = Number(req.body.price);
  if (req.file) f.image = "/uploads/" + req.file.filename;
  res.json(f);
});

app.delete("/vendors/:vid/foods/:fid", (req, res) => {
  const v = vendors.find(x => x.id === Number(req.params.vid));
  if (!v) return res.status(404).json({ error:"Not found" });
  v.foods = v.foods.filter(f => f.id !== Number(req.params.fid));
  res.json({ success:true });
});

app.post("/order", (req, res) => {
  const foodPrice = Number(req.body.foodPrice) || 0;
  const order = { id:Date.now(), food:req.body.food, address:req.body.address, vendorName:req.body.vendorName||"", foodPrice, deliveryFee:deliveryPrice, total:foodPrice+deliveryPrice, status:"pending", rider:"Not assigned" };
  orders.push(order);
  res.json(order);
});

app.get("/orders", (req, res) => res.json(orders));

app.post("/assign-rider/:id", (req, res) => {
  const o = orders.find(x => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error:"Not found" });
  o.rider = req.body.rider;
  o.status = "rider assigned";
  res.json(o);
});

app.post("/ready/:id", (req, res) => {
  const o = orders.find(x => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error:"Not found" });
  o.status = "ready";
  res.json(o);
});

app.post("/deliver/:id", (req, res) => {
  const o = orders.find(x => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error:"Not found" });
  o.status = "delivered";
  res.json(o);
});

app.post("/set-delivery-price", (req, res) => {
  deliveryPrice = Number(req.body.price);
  res.json({ price:deliveryPrice });
});

app.get("/delivery-price", (req, res) => res.json({ price:deliveryPrice }));

app.listen(3000, () => console.log("Foodflat running on port 3000"));
