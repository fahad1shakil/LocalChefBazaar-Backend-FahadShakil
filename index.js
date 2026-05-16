require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());

// Routes that don't need Database (Health Checks)
app.get('/', (req, res) => {
  res.send('Local Chef Bazaar Server is running - System OK');
});

app.get('/api/health', (req, res) => {
  res.send({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Database State
let client;
let db;
let collections = {};

async function getDB() {
  if (db) return collections;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      // Optimization for serverless
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    await client.connect();
  }

  db = client.db("LocalChefBazaar");
  collections = {
    users: db.collection("users"),
    meals: db.collection("meals"),
    orders: db.collection("orders"),
    reviews: db.collection("reviews"),
    roleRequests: db.collection("roleRequests"),
    favorites: db.collection("favorites"),
  };

  return collections;
}

// Global Database Middleware
app.use(async (req, res, next) => {
  try {
    const col = await getDB();
    req.db = col; // Attach collections to request object
    next();
  } catch (err) {
    console.error("Critical Database Error:", err.message);
    res.status(500).send({ 
      success: false, 
      message: "Server encountered a database connection issue",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// --- Users API ---
app.post('/users', async (req, res) => {
  const { users } = req.db;
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await users.findOne(query);
  if (existingUser) {
    return res.send({ message: 'user already exists', insertedId: null });
  }
  const newUser = { ...user, status: 'active', role: user.role || 'user' };
  const result = await users.insertOne(newUser);
  res.send(result);
});

app.get('/users', async (req, res) => {
  const result = await req.db.users.find().toArray();
  res.send({ success: true, data: result });
});

app.get('/all-users', async (req, res) => {
  const result = await req.db.users.find().toArray();
  res.send({ success: true, data: result });
});

app.get('/users/admin/:email', async (req, res) => {
  const user = await req.db.users.findOne({ email: req.params.email });
  res.send({ isAdmin: user?.role === 'admin' });
});

app.get('/users/chef/:email', async (req, res) => {
  const user = await req.db.users.findOne({ email: req.params.email });
  res.send({ isChef: user?.role === 'chef' });
});

app.get('/users/chefs', async (req, res) => {
  try {
    const result = await req.db.users.find({ role: 'chef' }).toArray();
    res.send({ success: true, data: result });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

app.get('/users/:email', async (req, res) => {
  const user = await req.db.users.findOne({ email: req.params.email });
  if (user) {
    res.send({ success: true, data: user });
  } else {
    res.status(404).send({ success: false, message: 'User not found' });
  }
});

app.get('/check-role/:email', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${req.params.email}$`, 'i') } });
    if (user?.status === 'banned') {
      return res.send({ success: true, role: 'banned', status: 'banned' });
    }
    res.send({ success: true, role: user?.role || 'user', status: user?.status });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

app.patch('/users/update-profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const { name, address, profileImg } = req.body;
    const filter = { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };
    const updateDoc = {
      $set: { ...(name && { name }), ...(address && { address }), ...(profileImg && { profileImg }) },
      $setOnInsert: { email: email, role: 'user', status: 'active', createdAt: new Date() }
    };
    const result = await req.db.users.updateOne(filter, updateDoc, { upsert: true });
    res.send({ success: true, message: 'Identity synchronized successfully', isNewUser: !!result.upsertedId });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.put('/users/update-role/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ success: false, message: 'Invalid ID' });
    const filter = { _id: new ObjectId(req.params.id) };
    const user = await req.db.users.findOne(filter);
    if (user?.email === 'fahad1shakil@gmail.com') return res.status(403).send({ success: false, message: 'Protected user' });
    await req.db.users.updateOne(filter, { $set: { role: req.body.role } });
    res.send({ success: true, data: { ...user, role: req.body.role } });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.patch('/users/ban/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ success: false, message: 'Invalid ID' });
    const filter = { _id: new ObjectId(req.params.id) };
    const user = await req.db.users.findOne(filter);
    if (user?.email === 'fahad1shakil@gmail.com') return res.status(403).send({ success: false, message: 'Protected user' });
    const newStatus = user?.status === 'banned' ? 'active' : 'banned';
    await req.db.users.updateOne(filter, { $set: { status: newStatus } });
    res.send({ success: true, data: { ...user, status: newStatus } });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

// --- Meals API ---
app.get('/meals', async (req, res) => {
  const result = await req.db.meals.find().toArray();
  res.send({ success: true, data: result });
});

app.get('/meals/latest', async (req, res) => {
  try {
    const result = await req.db.meals.find().sort({ _id: -1 }).limit(6).toArray();
    res.send({ success: true, data: result });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

app.post('/meals', async (req, res) => {
  const result = await req.db.meals.insertOne(req.body);
  res.send({ success: true, data: result });
});

app.get('/meals/:id', async (req, res) => {
  const result = await req.db.meals.findOne({ _id: new ObjectId(req.params.id) });
  res.send({ success: true, data: result });
});

app.delete('/meals/:id', async (req, res) => {
  const result = await req.db.meals.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send({ success: true, data: result });
});

app.get('/chef-meals/:email', async (req, res) => {
  try {
    const result = await req.db.meals.find({ userEmail: req.params.email }).toArray();
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

// --- Orders API ---
app.post('/orders', async (req, res) => {
  const result = await req.db.orders.insertOne(req.body);
  res.send({ success: true, data: result });
});

app.get('/orders', async (req, res) => {
  const result = await req.db.orders.find().toArray();
  res.send({ success: true, data: result });
});

app.get('/orders/:email', async (req, res) => {
  const result = await req.db.orders.find({ userEmail: req.params.email }).toArray();
  res.send({ success: true, data: result });
});

app.get('/chef-orders/:email', async (req, res) => {
  const result = await req.db.orders.find({ chefEmail: req.params.email }).toArray();
  res.send({ success: true, data: result });
});

app.patch('/orders/:id', async (req, res) => {
  const { status } = req.body;
  const filter = { _id: new ObjectId(req.params.id) };
  const updatedDoc = { $set: { status: status, orderStatus: status } };
  const result = await req.db.orders.updateOne(filter, updatedDoc);
  res.send({ success: true, data: result });
});

// --- Reviews API ---
app.post('/reviews', async (req, res) => {
  const result = await req.db.reviews.insertOne(req.body);
  res.send({ success: true, data: result });
});

app.get('/reviews/latest', async (req, res) => {
  try {
    const result = await req.db.reviews.find().sort({ _id: -1 }).limit(10).toArray();
    res.send({ success: true, data: result });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

app.get('/reviews/:mealId', async (req, res) => {
  const result = await req.db.reviews.find({ foodId: req.params.mealId }).toArray();
  res.send({ success: true, data: result });
});

app.get('/user-reviews/:email', async (req, res) => {
  const result = await req.db.reviews.find({ reviewerEmail: req.params.email }).toArray();
  res.send({ success: true, data: result });
});

// --- Favorites API ---
app.post('/favorites', async (req, res) => {
  try {
    const result = await req.db.favorites.insertOne(req.body);
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get('/favorites/:email', async (req, res) => {
  try {
    const result = await req.db.favorites.find({ userEmail: req.params.email }).toArray();
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.delete('/favorites/:id', async (req, res) => {
  try {
    const result = await req.db.favorites.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

// --- Statistics API ---
app.get('/admin-stats', async (req, res) => {
  try {
    const users = await req.db.users.estimatedDocumentCount();
    const meals = await req.db.meals.estimatedDocumentCount();
    const ordersCount = await req.db.orders.estimatedDocumentCount();
    const pendingOrders = await req.db.orders.countDocuments({ $or: [{ status: 'pending' }, { orderStatus: 'pending' }] });
    const deliveredOrders = await req.db.orders.countDocuments({ $or: [{ status: 'delivered' }, { orderStatus: 'delivered' }] });
    const payments = await req.db.orders.find({ $or: [{ status: 'delivered' }, { orderStatus: 'delivered' }] }).toArray();
    const totalRevenue = payments.reduce((sum, order) => sum + (parseFloat(order.price || 0) * (order.quantity || 1)), 0);
    res.send({ totalUsers: users, totalMeals: meals, totalOrders: ordersCount, pendingOrders, deliveredOrders, totalRevenue });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

app.get('/public-stats', async (req, res) => {
  try {
    const [mealsCount, reviewsCount, favoritesCount] = await Promise.all([
      req.db.meals.countDocuments(),
      req.db.reviews.countDocuments(),
      req.db.favorites.countDocuments()
    ]);
    res.send({ success: true, data: { totalMeals: mealsCount, totalReviews: reviewsCount, totalFavorites: favoritesCount } });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).send({ success: false, message: "Internal Server Error" });
});

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
