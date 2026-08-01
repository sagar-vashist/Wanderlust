const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const axios = require("axios");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res, next) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file ? req.file.path : "";
  let filename = req.file ? req.file.filename : "";

  const newListing = new Listing(req.body.listing);

  // Geoapify Forward Geocoding
  const location = req.body.listing.location;
  try {
    const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${process.env.MAP_TOKEN}`;
    const response = await axios.get(geoUrl);
    if (response.data && response.data.features && response.data.features.length > 0) {
      newListing.geometry = {
        type: "Point",
        coordinates: response.data.features[0].geometry.coordinates,
      };
    } else {
      newListing.geometry = { type: "Point", coordinates: [0, 0] };
    }
  } catch (err) {
    newListing.geometry = { type: "Point", coordinates: [0, 0] };
  }

  newListing.owner = req.user._id || req.user.id;
  newListing.image = { url, filename };
  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image ? listing.image.url : "";
  if (originalImageUrl) {
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  }
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
  let { query } = req.query;

  if (!query || query.trim() === "") {
    req.flash("error", "Please enter a destination to search");
    return res.redirect("/listings");
  }

  const allListings = await Listing.find({
    $or: [
      { location: { $regex: query, $options: "i" } },
      { country: { $regex: query, $options: "i" } },
    ],
  });

  res.render("listings/index.ejs", { allListings });
};

module.exports.getDestinations = async (req, res) => {
  const locations = await Listing.distinct("location");
  const countries = await Listing.distinct("country");

  // merge + remove duplicates
  const destinations = [...new Set([...locations, ...countries])];

  res.json(destinations);
};
