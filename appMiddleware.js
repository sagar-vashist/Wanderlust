const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

// String.prototype.equals polyfill for ObjectId comparison compatibility in EJS & JS
if (!String.prototype.equals) {
  String.prototype.equals = function (other) {
    if (other === null || other === undefined) return false;
    return this.toString() === other.toString();
  };
}

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to create Listing!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  const ownerId = listing.owner ? (listing.owner._id || listing.owner.id || listing.owner) : listing.ownerId;
  const currentUserId = res.locals.currUser ? (res.locals.currUser._id || res.locals.currUser.id) : null;

  if (!currentUserId || String(ownerId) !== String(currentUserId)) {
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review does not exist!");
    return res.redirect(`/listings/${id}`);
  }

  const authorId = review.author ? (review.author._id || review.author.id || review.author) : review.authorId;
  const currentUserId = res.locals.currUser ? (res.locals.currUser._id || res.locals.currUser.id) : null;

  if (!currentUserId || String(authorId) !== String(currentUserId)) {
    req.flash("error", "You are not the author of this review");
    return res.redirect(`/listings/${id}`);
  }

  next();
};
