const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './client/.env' });

async function checkMeals() {
    const uri = process.env.VITE_MONGODB_URI || "mongodb+srv://cluster0.81dwyib.mongodb.net/";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("LocalChefBazaar");
        const meals = await db.collection("meals").find().limit(5).toArray();
        console.log(JSON.stringify(meals, null, 2));
    } finally {
        await client.close();
    }
}

checkMeals();
