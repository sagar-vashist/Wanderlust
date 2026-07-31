const prisma = require("../db");

function formatReview(review) {
  if (!review) return null;
  return {
    ...review,
    _id: review.id,
    author: review.author
      ? {
          ...review.author,
          _id: review.author.id,
        }
      : null,
  };
}

class ReviewModel {
  constructor(data = {}) {
    this.comment = data.comment;
    this.rating = data.rating ? parseInt(data.rating, 10) : 1;
    this.author = data.author;
    this.createdAt = data.createdAt || new Date();
  }

  async save(listingId) {
    const authorId =
      typeof this.author === "object"
        ? this.author.id || this.author._id
        : this.author;

    const createdReview = await prisma.review.create({
      data: {
        comment: this.comment,
        rating: this.rating,
        authorId: String(authorId),
        listingId: String(listingId),
      },
      include: {
        author: true,
      },
    });

    const formatted = formatReview(createdReview);
    Object.assign(this, formatted);
    return this;
  }

  static async create(data) {
    const { comment, rating, author, listingId } = data;
    const authorId =
      typeof author === "object" ? author.id || author._id : author;

    const createdReview = await prisma.review.create({
      data: {
        comment,
        rating: parseInt(rating, 10),
        authorId: String(authorId),
        listingId: String(listingId),
      },
      include: {
        author: true,
      },
    });

    return formatReview(createdReview);
  }

  static async findById(id) {
    if (!id) return null;
    const review = await prisma.review.findUnique({
      where: { id: String(id) },
      include: { author: true },
    });
    return formatReview(review);
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    try {
      const review = await prisma.review.delete({
        where: { id: String(id) },
      });
      return formatReview(review);
    } catch (err) {
      return null;
    }
  }

  static async deleteMany(query) {
    if (query && query._id && query._id.$in) {
      return await prisma.review.deleteMany({
        where: { id: { in: query._id.$in.map(String) } },
      });
    }
    return await prisma.review.deleteMany({});
  }
}

ReviewModel.formatReview = formatReview;

module.exports = ReviewModel;
