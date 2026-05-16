const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const roleRequests = database.collection('roleRequests');

    const pending = await roleRequests.find({ status: 'pending' }).toArray();
    console.log('Pending Requests in DB:');
    console.log(JSON.stringify(pending, null, 2));

    const allUsers = await database.collection('users').find().toArray();
    console.log('Users in DB:');
    allUsers.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
