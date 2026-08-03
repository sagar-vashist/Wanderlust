if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();

// Trust Vercel / Reverse Proxy headers for HTTPS session cookies & Rate Limiting
app.set("trust proxy", 1);
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const User = require("./models/user.js");
const prisma = require("./db.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// 1. Environment Variable Validation
function validateEnv() {
  const criticalVars = ["DATABASE_URL"];
  if (process.env.NODE_ENV === "production") {
    criticalVars.push("SECRET", "CLOUD_NAME", "CLOUD_API_KEY", "CLOUD_API_SECRET");
  }
  const missing = criticalVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(", ")}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
validateEnv();

// Polyfill String.prototype.equals for EJS compatibility with ObjectId checks
if (!String.prototype.equals) {
  String.prototype.equals = function (other) {
    if (other === null || other === undefined) return false;
    return this.toString() === other.toString();
  };
}

// 4. Security Headers (Helmet & Content Security Policy)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.geoapify.com", "https://maps.geoapify.com", "https://basemaps.cartocdn.com", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://maps.geoapify.com", "https://*.basemaps.cartocdn.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
  })
);

// 5. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // 5 attempts per minute per IP
  message: "Too many authentication attempts, please try again in a minute",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/login", authLimiter);
app.use("/signup", authLimiter);

// 6. CORS Configuration
app.use((req, res, next) => {
  const allowedOrigins = [process.env.CLIENT_ORIGIN, "http://localhost:8080"].filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
  }),
  secret: process.env.SECRET || "development_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash & Global Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get("/privacy", (req, res) => {
  res.render("privacy.ejs");
});

app.get("/terms", (req, res) => {
  res.render("terms.ejs");
});

// 3. Error Handling & Stack Trace Protection
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  const correlationId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[Error ID ${correlationId}]`, err);
  } else {
    console.error(`[Error ID ${correlationId}] ${statusCode} - ${message}`);
  }

  const userMessage = (statusCode === 404 || statusCode === 400) ? message : "An unexpected error occurred. Please try again later.";
  res.status(statusCode).render("error.ejs", { message: userMessage });
});

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
  });
}

module.exports = app;
