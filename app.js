if (process.env.NODE_ENV !== `production`) {
  require(`dotenv`).config();
}
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require(`express-session`);
const ExpressError = require("./utils/ExpressError");
const flash = require(`connect-flash`);
const passport = require(`passport`);
const LocalStrategy = require(`passport-local`);
const User = require(`./models/user`);
const sanitizeV5 = require("./utils/mongoSanitizeV5.js");

const helmet = require(`helmet`);

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const { contentSecurityPolicy } = require("helmet");

const MongoStore = require("connect-mongo");

const dbUrl = process.env.DB_URL || `mongodb://localhost:27017/yelp-camp`;

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

app.set("query parser", "extended"); // mongosanitize

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, `public`)));
app.use(sanitizeV5({ replaceWith: "_" }));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 3600, // 24 hours
  crypto: {
    secret: process.env.SESSION_SECRET || "dev-secret",
  },
});

store.on(`error`, function (e) {
  console.log(`Session store error`, e);
});

const sessionConfig = {
  store,
  name: "session",
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};
app.use(session(sessionConfig));

app.use(flash());

app.use(helmet());

const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.maptiler.com/",
];

const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.maptiler.com/",
];

const connectSrcUrls = [
  "https://api.maptiler.com/",
  "https://events.maptiler.com/", // If you see events.maptiler.com errors too
  "https://cdn.maptiler.com/", // Source maps
  "https://cdn.jsdelivr.net", // Bootstrap source maps
];

const fontSrcUrls = [];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/diebt4sd6/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/",
        "https://api.maptiler.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash(`success`);
  res.locals.error = req.flash(`error`);
  next();
});

// routes
app.use(`/`, userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

// 404 handler
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(`Page Not Found`, 404));
});

// error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
