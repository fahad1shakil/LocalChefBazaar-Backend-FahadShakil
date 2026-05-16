const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const users = database.collection('users');

    const result = await users.updateOne(
        { email: 'fahad10pic@gmail.com' },
        { 
            $set: { role: 'admin' },
            $setOnInsert: {
                name: 'Fahad HERO',
                email: 'fahad10pic@gmail.com',
                status: 'active'
            }
        },
        { upsert: true }
    );
    
    console.log(`Successfully fixed fahad10pic@gmail.com!`);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
