const express = require(`express`);
const path = require(`path`);
const mongoose = require(`mongoose`);
const Campground = require(`./models/campground`);
const Review = require(`./models/review`);
const methodOverride = require(`method-override`);
const ejsMate = require(`ejs-mate`);
const catchAsync = require(`./utils/catchAsync`);
const ExpressError = require(`./utils/ExpressError`);
const { campgroundSchema, reviewSchema } = require(`./schemas.js`);
mongoose.connect(`mongodb://localhost:27017/yelp-camp`); // mongo listening on 27017, temporary hardcode

const campgrounds = require(`./routes/campgrounds`);

// error handling for db connection
const db = mongoose.connection;
db.on(`error`, console.error.bind(console, `connection error:`));
db.once(`open`, () => {
  console.log(`Database connected`);
});

const app = express();

app.engine(`ejs`, ejsMate);
app.set(`view engine`, `ejs`); // ejs for dynamic web pages
app.set(`views`, path.join(__dirname, `views`));

// middleware
app.use(express.urlencoded({ extended: true })); // parses form data into req.body
app.use(methodOverride(`_method`)); // this enables put and patch requests

const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(`,`);
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(`,`);
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

app.use(`/campgrounds`, campgrounds);

// define routes
app.get(`/`, (req, res) => {
  res.render(`home`);
});

app.post(
  `/campgrounds/:id/reviews`,
  validateReview,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

app.delete(
  "/campgrounds/:id/reviews/:reviewId",
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
  })
);

// error handler
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(`Page Not Found`, 404));
});

// error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = `Something went wrong!`;
  res.status(statusCode).render(`error`, { err });
});

// start the express web app, listening for requests
app.listen(3000, () => {
  console.log(`Serving on port 3000`);
});
