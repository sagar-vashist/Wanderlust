if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../.env" });
  require("dotenv").config();
}

const prisma = require("../db.js");
const axios = require("axios");

const mapToken = process.env.MAP_TOKEN;

async function updateListingCoordinates() {
  if (!mapToken) {
    console.error("MAP_TOKEN environment variable is required to geocode coordinates.");
    process.exit(1);
  }

  try {
    console.log("Fetching all listings from database...");
    const listings = await prisma.listing.findMany();

    console.log(`Found ${listings.length} listings. Geocoding locations...`);

    for (const listing of listings) {
      try {
        const queryText = `${listing.location}, ${listing.country}`;
        const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(queryText)}&apiKey=${mapToken}`;
        const res = await axios.get(geoUrl);

        if (res.data && res.data.features && res.data.features.length > 0) {
          const coords = res.data.features[0].geometry.coordinates;
          const longitude = parseFloat(coords[0]);
          const latitude = parseFloat(coords[1]);

          await prisma.listing.update({
            where: { id: listing.id },
            data: { longitude, latitude },
          });

          console.log(`Updated ${listing.title} (${listing.location}, ${listing.country}): [${longitude}, ${latitude}]`);
        }
      } catch (err) {
        console.error(`Failed to geocode listing ${listing.id}:`, err.message);
      }
    }

    console.log("All listing coordinates updated successfully!");
  } catch (err) {
    console.error("Error updating coordinates:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateListingCoordinates();
