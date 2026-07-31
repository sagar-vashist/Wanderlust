const prisma = require("../db");
const bcrypt = require("bcryptjs");

function formatUser(user) {
  if (!user) return null;
  return {
    ...user,
    _id: user.id,
  };
}

const User = {
  async findById(id) {
    if (!id) return null;
    const user = await prisma.user.findUnique({ where: { id: String(id) } });
    return formatUser(user);
  },

  async findOne(query) {
    if (!query) return null;
    let where = {};
    if (query.username) where.username = query.username;
    if (query.email) where.email = query.email;
    if (query.id || query._id) where.id = String(query.id || query._id);

    const user = await prisma.user.findFirst({ where });
    return formatUser(user);
  },

  async register(userData, password) {
    const { username, email } = userData;

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      if (existing.username === username) {
        throw new Error("A user with the given username is already registered");
      }
      if (existing.email === email) {
        throw new Error("A user with the given email is already registered");
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const createdUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return formatUser(createdUser);
  },

  authenticate() {
    return async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, formatUser(user));
      } catch (err) {
        return done(err);
      }
    };
  },

  serializeUser() {
    return (user, done) => {
      done(null, user.id || user._id);
    };
  },

  deserializeUser() {
    return async (id, done) => {
      try {
        const user = await User.findById(id);
        done(null, user);
      } catch (err) {
        done(err);
      }
    };
  },
};

module.exports = User;
