if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../.env" });
  require("dotenv").config();
}

const prisma = require("../db.js");
const initData = require("./data.js");
const User = require("../models/user.js");

const initDB = async () => {
  try {
    console.log("Cleaning old database records...");
    await prisma.review.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});

    console.log("Creating default owner user...");
    const owner = await User.register(
      {
        username: "demo_owner",
        email: "owner@wanderlust.com",
      },
      "ownerpassword123"
    );

    console.log("Seeding listings...");
    for (let obj of initData.data) {
      const imageUrl = obj.image?.url || (typeof obj.image === "string" ? obj.image : "");
      const imageFilename = obj.image?.filename || "listingimage";
      const price = parseFloat(obj.price) || 0;

      await prisma.listing.create({
        data: {
          title: obj.title,
          description: obj.description,
          price,
          location: obj.location,
          country: obj.country,
          imageUrl,
          imageFilename,
          longitude: 77.2090, // Default coordinates if geocoding not done at seed
          latitude: 28.6139,
          ownerId: owner.id,
        },
      });
    }

    console.log("Database successfully initialized with seed data!");
  } catch (err) {
    console.error("Error initializing DB:", err);
  } finally {
    await prisma.$disconnect();
  }
};

initDB();
