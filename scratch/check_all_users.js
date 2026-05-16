const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const users = database.collection('users');

    const allUsers = await users.find().toArray();
    console.log('All Registered Users:');
    allUsers.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
