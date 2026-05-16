const { MongoClient, ServerApiVersion } = require('mongodb');

async function checkUser() {
  const uri = "mongodb+srv://LocalChefBazaar:LocalChefBazaar@cluster0.81dwyib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    const db = client.db("LocalChefBazaar");
    const usersCollection = db.collection("users");
    
    const email = "fahad1shakil@gmail.com";
    const user = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    console.log("User data found in DB:");
    console.log(JSON.stringify(user, null, 2));
    
  } finally {
    await client.close();
  }
}

checkUser().catch(console.error);
