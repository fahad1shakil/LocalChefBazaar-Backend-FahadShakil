const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

// Basic Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'https://localchefbazzar-fahadshakil.netlify.app'],
  credentials: true
}));
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
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("CRITICAL: MONGODB_URI is missing from .env file");
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  // If already connected, verify connection health
  if (client && db && collections.users) {
    try {
      // Ping the database to verify the connection is active
      await db.command({ ping: 1 });
      return collections;
    } catch (pingError) {
      console.warn("MongoDB connection stale or lost. Attempting auto-reconnection...", pingError.message);
      try {
        await client.close();
      } catch (closeError) {
        // Ignore closing errors
      }
      client = null;
      db = null;
      collections = {};
    }
  }

  try {
    if (!client) {
      console.log("Establishing a resilient connection to MongoDB Atlas...");
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      // Automatically purge stale caches on disconnect events
      client.on('close', () => {
        console.warn("MongoDB connection closed. Purging client cache for auto-reconnection.");
        client = null;
        db = null;
        collections = {};
      });

      client.on('timeout', () => {
        console.warn("MongoDB connection timed out. Purging client cache for auto-reconnection.");
        client = null;
        db = null;
        collections = {};
      });

      await client.connect();
    }

    db = client.db("LocalChefBazaar");
    
    // Verify connection integrity immediately
    await db.command({ ping: 1 });

    collections = {
      users: db.collection("users"),
      meals: db.collection("meals"),
      orders: db.collection("orders"),
      reviews: db.collection("reviews"),
      roleRequests: db.collection("roleRequests"),
      favorites: db.collection("favorites"),
    };

    console.log("Successfully connected to MongoDB Atlas");
    return collections;
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    client = null; // Reset state for subsequent retries
    db = null;
    collections = {};
    throw err;
  }
}

// Global Database Middleware
app.use(async (req, res, next) => {
  // Skip DB for health checks
  if (req.path === '/' || req.path === '/api/health') return next();

  try {
    const col = await getDB();
    req.db = col;
    next();
  } catch (err) {
    console.error("Database Middleware Error:", err.message);
    res.status(503).send({ 
      success: false, 
      message: "Database connection failed. Please check MONGODB_URI in server/.env",
      error: err.message
    });
  }
});

// --- Users API ---
app.post('/users', async (req, res) => {
  try {
    const { users } = req.db;
    const user = req.body;
    
    if (!user.email) {
      return res.status(400).send({ success: false, message: 'Email is required' });
    }

    const query = { email: { $regex: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };
    
    const updateDoc = {
      $setOnInsert: {
        name: user.name || '',
        email: user.email,
        profileImg: user.profileImg || user.image || '',
        address: user.address || '',
        role: user.role || 'user',
        status: 'active',
        provider: user.provider || 'google',
        uid: user.uid || '',
        createdAt: user.createdAt || new Date().toISOString()
      }
    };

    await users.findOneAndUpdate(query, updateDoc, { upsert: true });
    const savedUser = await users.findOne(query);

    res.send({ 
      success: true, 
      data: savedUser, 
      insertedId: savedUser._id, 
      message: 'User synchronized successfully' 
    });
  } catch (err) {
    console.error('Error in POST /users:', err.message);
    res.status(500).send({ success: false, message: err.message });
  }
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
  try {
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${req.params.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    res.send({ isAdmin: user?.role === 'admin' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get('/users/chef/:email', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${req.params.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    res.send({ isChef: user?.role === 'chef' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
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
  try {
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${req.params.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (user) {
      res.send({ success: true, data: user });
    } else {
      res.status(404).send({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get('/check-role/:email', async (req, res) => {
  try {
    const escapedEmail = req.params.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } });
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

app.put('/meals/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedDoc = { $set: req.body };
    const result = await req.db.meals.updateOne(filter, updatedDoc);
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
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

// --- Users API ---
app.get('/users/check/:email', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${req.params.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (user) {
      res.send({ success: true, data: user });
    } else {
      res.status(404).send({ success: false, message: 'User not found' });
    }
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

app.get('/all-orders', async (req, res) => {
  try {
    const result = await req.db.orders.find().toArray();
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get('/orders/:email', async (req, res) => {
  const result = await req.db.orders.find({ userEmail: req.params.email }).toArray();
  res.send({ success: true, data: result });
});

app.get('/chef-orders/:email', async (req, res) => {
  const result = await req.db.orders.find({ chefEmail: req.params.email }).toArray();
  res.send({ success: true, data: result });
});

app.get('/user-chef-orders/:email', async (req, res) => {
  try {
    const result = await req.db.orders.find({ chefEmail: req.params.email }).toArray();
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
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

app.get('/chef-reviews/:email', async (req, res) => {
  try {
    const result = await req.db.reviews.find({ chefEmail: req.params.email }).toArray();
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
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

// --- Users & Roles API ---
app.get('/chef-id/:email', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ email: { $regex: new RegExp(`^${req.params.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    res.send({ success: true, chefId: user?.chefId || null });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.put('/users/demote/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ success: false, message: 'Invalid ID' });
    const filter = { _id: new ObjectId(req.params.id) };
    await req.db.users.updateOne(filter, { $set: { role: 'user' } });
    res.send({ success: true, message: 'Authority downgraded to standard user' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

// --- Role Requests API ---
app.get('/role-requests', async (req, res) => {
  try {
    const result = await req.db.roleRequests.find().toArray();
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.post('/role-requests', async (req, res) => {
  try {
    const result = await req.db.roleRequests.insertOne(req.body);
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

// Alias for inconsistent frontend naming
app.post('/role-request', async (req, res) => {
  try {
    const result = await req.db.roleRequests.insertOne(req.body);
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.patch('/role-requests/:id/approve', async (req, res) => {
  try {
    const id = req.params.id;
    const request = await req.db.roleRequests.findOne({ _id: new ObjectId(id) });
    if (!request) return res.status(404).send({ success: false, message: 'Request not found' });

    // Update user role with case-insensitive email matching
    const emailFilter = { email: { $regex: new RegExp(`^${request.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };
    const user = await req.db.users.findOne(emailFilter);
    
    const updateDoc = { $set: { role: request.requestedRole } };
    if (request.requestedRole === 'chef' && user && !user.chefId) {
      updateDoc.$set.chefId = `chef-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    await req.db.users.updateOne(emailFilter, updateDoc);

    // Delete the request
    await req.db.roleRequests.deleteOne({ _id: new ObjectId(id) });

    res.send({ success: true, message: 'Authority status upgraded' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.patch('/role-requests/:id/decline', async (req, res) => {
  try {
    await req.db.roleRequests.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send({ success: true, message: 'Authority request terminated' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

// --- Statistics API ---
app.get('/revenue-stats', async (req, res) => {
  try {
    const orders = await req.db.orders.find({ $or: [{ status: 'delivered' }, { orderStatus: 'delivered' }] }).toArray();
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.price || 0) * (order.quantity || 1)), 0);
    res.send({ success: true, totalRevenue, data: orders });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

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
const port = process.env.PORT || 5000;
app.listen(port, async () => {
  console.log(`🚀 LocalChefBazaar Server running on http://localhost:${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    await getDB();
  } catch (err) {
    console.error("⚠️ Initial database connection attempt failed. Connection will be retried on incoming API requests.");
  }
});

module.exports = app;
