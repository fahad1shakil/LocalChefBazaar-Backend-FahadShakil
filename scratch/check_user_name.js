const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const users = database.collection('users');

    const user = await users.findOne({ email: "fahad02shakil@gmail.com" });
    console.log('User Details:', JSON.stringify(user, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
