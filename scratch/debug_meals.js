require('dotenv').config({ path: '../server/.env' });
const { MongoClient } = require('mongodb');

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const meals = await client.db("LocalChefBazaar").collection("meals").find().toArray();
    console.log("Total Meals:", meals.length);
    meals.forEach(m => console.log(`- ${m.foodName}`));
  } finally {
    await client.close();
  }
}
check();
