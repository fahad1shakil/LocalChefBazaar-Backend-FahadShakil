const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const users = database.collection('users');

    const email = "fahadadmin@localchefbazaar.com";
    
    // Update all variations to be ADMIN
    await users.updateMany(
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      { $set: { role: 'admin', status: 'active' } }
    );
    
    console.log(`User ${email} is now FORCE-SET to ADMIN in the database.`);
    
    // List current state
    const check = await users.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (check) {
       console.log('Final DB State:', check.email, 'Role:', check.role);
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
