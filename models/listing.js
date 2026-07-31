const prisma = require("../db");

const defaultLink =
  "https://images.unsplash.com/photo-1586810724476-c294fb7ac01b?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function formatListing(listing) {
  if (!listing) return null;

  const reviews = Array.isArray(listing.reviews)
    ? listing.reviews.map((r) => ({
        ...r,
        _id: r.id,
        author: r.author
          ? {
              ...r.author,
              _id: r.author.id,
            }
          : null,
      }))
    : [];

  const owner = listing.owner
    ? {
        ...listing.owner,
        _id: listing.owner.id,
      }
    : null;

  return {
    ...listing,
    _id: listing.id,
    image: {
      url: listing.imageUrl || defaultLink,
      filename: listing.imageFilename || "",
    },
    geometry: {
      type: "Point",
      coordinates: [listing.longitude || 0, listing.latitude || 0],
    },
    owner,
    reviews,
  };
}

class ListingModel {
  constructor(data = {}) {
    if (data.id || data._id) {
      this.id = data.id || data._id;
      this._id = this.id;
    }
    this.title = data.title;
    this.description = data.description;
    this.price = data.price !== undefined ? parseFloat(data.price) : 0;
    this.location = data.location;
    this.country = data.country;
    this.image = data.image || { url: data.imageUrl || defaultLink, filename: data.imageFilename || "" };
    this.geometry = data.geometry || {
      type: "Point",
      coordinates: [data.longitude || 0, data.latitude || 0],
    };
    this.owner = data.owner || data.ownerId;
  }

  async save() {
    const ownerId =
      typeof this.owner === "object"
        ? this.owner.id || this.owner._id
        : this.owner;

    const imageUrl = this.image?.url || defaultLink;
    const imageFilename = this.image?.filename || "";
    const longitude = this.geometry?.coordinates?.[0] || 0;
    const latitude = this.geometry?.coordinates?.[1] || 0;

    if (this.id) {
      const updated = await prisma.listing.update({
        where: { id: String(this.id) },
        data: {
          title: this.title,
          description: this.description,
          price: parseFloat(this.price),
          location: this.location,
          country: this.country,
          imageUrl,
          imageFilename,
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          ...(ownerId ? { ownerId: String(ownerId) } : {}),
        },
        include: {
          owner: true,
          reviews: {
            include: { author: true },
          },
        },
      });

      const formatted = formatListing(updated);
      Object.assign(this, formatted);
      return this;
    } else {
      const created = await prisma.listing.create({
        data: {
          title: this.title,
          description: this.description,
          price: parseFloat(this.price),
          location: this.location,
          country: this.country,
          imageUrl,
          imageFilename,
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          ownerId: String(ownerId),
        },
        include: {
          owner: true,
          reviews: {
            include: { author: true },
          },
        },
      });

      const formatted = formatListing(created);
      Object.assign(this, formatted);
      return this;
    }
  }

  static async find(filter = {}) {
    let where = {};
    if (filter.$or && Array.isArray(filter.$or)) {
      where.OR = filter.$or.map((cond) => {
        let fieldCond = {};
        if (cond.location && cond.location.$regex) {
          fieldCond.location = {
            contains: cond.location.$regex,
            mode: "insensitive",
          };
        }
        if (cond.country && cond.country.$regex) {
          fieldCond.country = {
            contains: cond.country.$regex,
            mode: "insensitive",
          };
        }
        return fieldCond;
      });
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        owner: true,
        reviews: {
          include: { author: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return listings.map(formatListing);
  }

  static async findById(id) {
    if (!id) return null;
    const listing = await prisma.listing.findUnique({
      where: { id: String(id) },
      include: {
        owner: true,
        reviews: {
          include: { author: true },
        },
      },
    });

    if (!listing) return null;
    const formatted = formatListing(listing);
    const instance = new ListingModel(formatted);
    Object.assign(instance, formatted);
    return instance;
  }

  static async findByIdAndUpdate(id, updateData) {
    if (!id) return null;
    const existing = await ListingModel.findById(id);
    if (!existing) return null;

    if (updateData.title !== undefined) existing.title = updateData.title;
    if (updateData.description !== undefined) existing.description = updateData.description;
    if (updateData.price !== undefined) existing.price = updateData.price;
    if (updateData.location !== undefined) existing.location = updateData.location;
    if (updateData.country !== undefined) existing.country = updateData.country;
    if (updateData.image !== undefined) existing.image = updateData.image;
    if (updateData.geometry !== undefined) existing.geometry = updateData.geometry;

    await existing.save();
    return existing;
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    try {
      const deleted = await prisma.listing.delete({
        where: { id: String(id) },
        include: {
          owner: true,
          reviews: {
            include: { author: true },
          },
        },
      });
      return formatListing(deleted);
    } catch (err) {
      return null;
    }
  }

  static async deleteMany(query) {
    return await prisma.listing.deleteMany({});
  }

  static async insertMany(dataArray) {
    const results = [];
    for (const item of dataArray) {
      const listing = new ListingModel(item);
      await listing.save();
      results.push(listing);
    }
    return results;
  }

  static async distinct(field) {
    const listings = await prisma.listing.findMany({
      select: { [field]: true },
    });
    const values = listings.map((l) => l[field]).filter(Boolean);
    return [...new Set(values)];
  }
}

ListingModel.formatListing = formatListing;

module.exports = ListingModel;
