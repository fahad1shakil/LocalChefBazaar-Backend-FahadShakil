const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const users = database.collection('users');

    const email = "fahad1shakil@gmail.com";
    
    // Check if user exists
    const user = await users.findOne({ email: email });
    
    if (user) {
      console.log('User found:', user.name, user.role);
      const result = await users.updateOne(
        { email: email },
        { $set: { role: 'admin', status: 'active' } }
      );
      console.log(`${result.matchedCount} document(s) matched the query criteria.`);
      console.log(`${result.modifiedCount} document(s) was/were updated.`);
      console.log(`User ${email} is now an ADMIN.`);
    } else {
      console.log(`User with email ${email} not found. You might need to sign up first on the website.`);
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
