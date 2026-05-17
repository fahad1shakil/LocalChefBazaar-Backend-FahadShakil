const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in env variables!");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("=== Connected to MongoDB ===");
    
    // List all databases
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log("\n--- Databases in the Cluster ---");
    for (let dbInfo of dbsList.databases) {
      console.log(`- Database Name: "${dbInfo.name}" | Size: ${dbInfo.sizeOnDisk} bytes`);
      
      const dbInstance = client.db(dbInfo.name);
      const collections = await dbInstance.listCollections().toArray();
      for (let col of collections) {
        const count = await dbInstance.collection(col.name).countDocuments({});
        console.log(`  └─ Collection: "${col.name}" | Count: ${count}`);
      }
    }

  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    await client.close();
  }
}

run();
