const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const roleRequests = database.collection('roleRequests');

    const sample = await roleRequests.findOne({ status: 'pending' });
    console.log('Sample Pending Request:', JSON.stringify(sample, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
