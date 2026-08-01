if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../.env" });
  require("dotenv").config();
}

const prisma = require("../db.js");
const initData = require("./data.js");
const User = require("../models/user.js");
const axios = require("axios");

const mapToken = process.env.MAP_TOKEN;
const seedOwnerPassword = process.env.SEED_OWNER_PASSWORD || process.env.SECRET || "demo_owner_pass";

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
      seedOwnerPassword
    );

    console.log("Seeding listings with exact geocoded coordinates...");
    for (let obj of initData.data) {
      const imageUrl = obj.image?.url || (typeof obj.image === "string" ? obj.image : "");
      const imageFilename = obj.image?.filename || "listingimage";
      const price = parseFloat(obj.price) || 0;

      let longitude = 77.2090;
      let latitude = 28.6139;

      if (mapToken) {
        try {
          const queryText = `${obj.location}, ${obj.country}`;
          const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(queryText)}&apiKey=${mapToken}`;
          const res = await axios.get(geoUrl);
          if (res.data && res.data.features && res.data.features.length > 0) {
            const coords = res.data.features[0].geometry.coordinates;
            longitude = coords[0];
            latitude = coords[1];
          }
        } catch (e) {
          console.warn(`Geocoding fallback for ${obj.location}, ${obj.country}`);
        }
      }

      await prisma.listing.create({
        data: {
          title: obj.title,
          description: obj.description,
          price,
          location: obj.location,
          country: obj.country,
          imageUrl,
          imageFilename,
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          ownerId: owner.id,
        },
      });
    }

    console.log("Database successfully re-seeded with geocoded locations!");
  } catch (err) {
    console.error("Error initializing DB:", err);
  } finally {
    await prisma.$disconnect();
  }
};

initDB();
