const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('LocalChefBazaar');
    const users = database.collection('users');

    const emailsToRemove = [
      "FahadAdmin@LocalChefBazaar.com",
      "submission@admin.com",
      "fahadadmin@localchefbazaar.com" // Case-insensitive check
    ];

    const result = await users.deleteMany({ 
      email: { $in: emailsToRemove } 
    });
    
    console.log(`Successfully removed ${result.deletedCount} temporary admin accounts.`);
    
    // Check remaining users
    const remaining = await users.find().toArray();
    console.log('Remaining Registered Users:');
    remaining.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));

  } finally {
    await client.close();
  }
}
run().catch(console.dir);
