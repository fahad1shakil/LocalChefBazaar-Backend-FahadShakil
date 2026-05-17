const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const TARGET_EMAIL = 'fahad10pic@gmail.com';
const TARGET_ROLE  = 'admin';

async function makeAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in your .env file!');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅  Connected to MongoDB Atlas');

    const db = client.db('LocalChefBazaar');
    const users = db.collection('users');

    // 1. Find the user first
    const existingUser = await users.findOne({ email: { $regex: new RegExp(`^${TARGET_EMAIL}$`, 'i') } });

    if (!existingUser) {
      console.log(`\n⚠️  No user found with email: ${TARGET_EMAIL}`);
      console.log('    The user may not have registered yet (users are created on first login).');
      console.log('\n📋  Current users in the database:');
      const allUsers = await users.find({}, { projection: { email: 1, role: 1, name: 1 } }).toArray();
      allUsers.forEach((u, i) => {
        console.log(`    ${i + 1}. ${u.email} — role: ${u.role || 'user'} — name: ${u.name || 'N/A'}`);
      });
      return;
    }

    console.log(`\n👤  Found user:`);
    console.log(`    Name  : ${existingUser.name || 'N/A'}`);
    console.log(`    Email : ${existingUser.email}`);
    console.log(`    Role  : ${existingUser.role || 'user'} → ${TARGET_ROLE}`);

    // 2. Update the role to admin
    const result = await users.updateOne(
      { _id: existingUser._id },
      { $set: { role: TARGET_ROLE } }
    );

    if (result.modifiedCount === 1) {
      console.log(`\n🎉  SUCCESS! Role updated to "${TARGET_ROLE}" for ${TARGET_EMAIL}`);
    } else {
      console.log(`\n⚠️  No change was made (user may already have the "${TARGET_ROLE}" role).`);
    }

    // 3. Verify by re-fetching
    const updated = await users.findOne({ _id: existingUser._id });
    console.log(`\n🔍  Verification — Current role in DB: "${updated.role}"`);

  } catch (err) {
    console.error('❌  Error:', err.message);
  } finally {
    await client.close();
    console.log('\n🔌  Disconnected from MongoDB Atlas');
  }
}

makeAdmin();
