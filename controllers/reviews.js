const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const authorId = req.user._id || req.user.id;
  const listingId = listing._id || listing.id;

  await Review.create({
    comment: req.body.review.comment,
    rating: req.body.review.rating,
    author: authorId,
    listingId: listingId,
  });

  req.flash("success", "New Review Created!");
  res.redirect(`/listings/${listingId}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;

  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review Deleted!");
  res.redirect(`/listings/${id}`);
};
