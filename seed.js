require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function seed() {
  try {
    await client.connect();
    const db = client.db("LocalChefBazaar");
    
    // Clear existing data
    await db.collection("users").deleteMany({});
    await db.collection("meals").deleteMany({});
    await db.collection("reviews").deleteMany({});

    // 1. Seed User (You)
    const users = [
      {
        name: "Fahad Shakil",
        email: "fahad1shakil@gmail.com",
        role: "admin",
        status: "active",
        profileImg: "https://i.ibb.co.com/8LzP7mP/admin.jpg",
        address: "Dhaka, Bangladesh",
        chefId: "chef-5555"
      }
    ];
    await db.collection("users").insertMany(users);

    const now = new Date();

    // 2. THE TOP 12 HEAVY MEALS (Most Recent Dates)
    const top12Meals = [
      {
        foodName: "Old Town Style Mutton Tehari",
        foodImage: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=2000",
        price: 380, rating: 5.0, ingredients: ["Mutton", "Kalijira Rice"], createdAt: new Date(now.getTime() + 12000)
      },
      {
        foodName: "Dhaka Style Morog Polao",
        foodImage: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=2000",
        price: 350, rating: 5.0, ingredients: ["Chicken", "Polao Rice"], createdAt: new Date(now.getTime() + 11000)
      },
      {
        foodName: "Narayanganj Special Beef Bhuna",
        foodImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=2000",
        price: 450, rating: 4.9, ingredients: ["Beef", "Mustard Oil"], createdAt: new Date(now.getTime() + 10000)
      },
      {
        foodName: "Seafood Paella with Saffron",
        foodImage: "https://images.unsplash.com/photo-1534080564607-c92751f8939f?q=80&w=2000",
        price: 750, rating: 4.8, ingredients: ["Shrimp", "Mussels", "Rice"], createdAt: new Date(now.getTime() + 9000)
      },
      {
        foodName: "Authentic Butter Chicken with Naan",
        foodImage: "https://images.unsplash.com/photo-1603894584114-f06b6f72233f?q=80&w=2000",
        price: 420, rating: 4.9, ingredients: ["Chicken", "Cream", "Naan"], createdAt: new Date(now.getTime() + 8000)
      },
      {
        foodName: "Slow-Cooked Lamb Shank",
        foodImage: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000",
        price: 1200, rating: 5.0, ingredients: ["Lamb", "Rosemary"], createdAt: new Date(now.getTime() + 7000)
      },
      {
        foodName: "Honey-Glazed Salmon with Asparagus",
        foodImage: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=2000",
        price: 850, rating: 5.0, ingredients: ["Salmon", "Honey"], createdAt: new Date(now.getTime() + 6000)
      },
      {
        foodName: "Thai Green Curry with Jasmine Rice",
        foodImage: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=2000",
        price: 420, rating: 4.9, ingredients: ["Curry", "Rice"], createdAt: new Date(now.getTime() + 5000)
      },
      {
        foodName: "Korean Bulgogi Beef Rice Bowl",
        foodImage: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=2000",
        price: 520, rating: 4.9, ingredients: ["Beef", "Kimchi"], createdAt: new Date(now.getTime() + 4000)
      },
      {
        foodName: "Smoked Hilsha with Steamed Rice",
        foodImage: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=2000",
        price: 650, rating: 5.0, ingredients: ["Hilsha", "Mustard Paste"], createdAt: new Date(now.getTime() + 3000)
      },
      {
        foodName: "Wild Mushroom & Thyme Risotto",
        foodImage: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=2000",
        price: 480, rating: 4.9, ingredients: ["Rice", "Mushrooms"], createdAt: new Date(now.getTime() + 2000)
      },
      {
        foodName: "Zesty Garlic Butter Shrimp",
        foodImage: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?q=80&w=2000",
        price: 550, rating: 4.9, ingredients: ["Shrimp", "Garlic"], createdAt: new Date(now.getTime() + 1000)
      }
    ].map(m => ({
      ...m, chefName: "Fahad Shakil", chefId: "chef-5555", deliveryArea: "Gulshan",
      estimatedDeliveryTime: "40 mins", chefExperience: "15", userEmail: "fahad1shakil@gmail.com"
    }));

    // 3. THE 4 BEST DRINKS (Slightly Older)
    const bestDrinks = [
      {
        foodName: "Caramel Macchiato",
        foodImage: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=2000",
        price: 240, rating: 5.0, ingredients: ["Espresso", "Caramel"], createdAt: new Date(now.getTime() - 1000)
      },
      {
        foodName: "Mango & Yogurt Lassi",
        foodImage: "https://images.unsplash.com/photo-1571006682855-3fc35578749a?q=80&w=2000",
        price: 180, rating: 4.9, ingredients: ["Mango", "Yogurt"], createdAt: new Date(now.getTime() - 2000)
      },
      {
        foodName: "Fresh Mint Lemonade",
        foodImage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=2000",
        price: 150, rating: 4.8, ingredients: ["Lemon", "Mint"], createdAt: new Date(now.getTime() - 3000)
      },
      {
        foodName: "Signature Hot Chocolate",
        foodImage: "https://images.unsplash.com/photo-1544787210-2211d40a5165?q=80&w=2000",
        price: 220, rating: 4.9, ingredients: ["Chocolate", "Milk"], createdAt: new Date(now.getTime() - 4000)
      }
    ].map(m => ({
      ...m, chefName: "Fahad Shakil", chefId: "chef-5555", deliveryArea: "All Dhaka",
      estimatedDeliveryTime: "10 mins", chefExperience: "Barista", userEmail: "fahad1shakil@gmail.com"
    }));

    // 4. THE REST (Older Dates)
    const rest = [
      {
        foodName: "High-Protein Chicken Salad",
        foodImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000",
        price: 280, rating: 4.8, ingredients: ["Chicken", "Kale"], createdAt: new Date(now.getTime() - 10000)
      },
      {
        foodName: "Mediterranean Falafel Wrap",
        foodImage: "https://images.unsplash.com/photo-1593001874117-c99c4edb8150?q=80&w=2000",
        price: 180, rating: 4.6, ingredients: ["Chickpeas", "Flatbread"], createdAt: new Date(now.getTime() - 11000)
      }
    ].map(m => ({
      ...m, chefName: "Fahad Shakil", chefId: "chef-5555", deliveryArea: "Dhanmondi",
      estimatedDeliveryTime: "20 mins", chefExperience: "Expert", userEmail: "fahad1shakil@gmail.com"
    }));

    await db.collection("meals").insertMany([...top12Meals, ...bestDrinks, ...rest]);

    console.log("Curated Menu Seeded Successfully! 🚀");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

seed();
