const express = require(`express`);
const path = require(`path`);
const mongoose = require(`mongoose`);
const Campground = require(`./models/campground`);
const methodOverride = require(`method-override`);
const ejsMate = require(`ejs-mate`);
const catchAsync = require(`./utils/catchAsync`);
const ExpressError = require(`./utils/ExpressError`);

mongoose.connect(`mongodb://localhost:27017/yelp-camp`); // mongo listening on 27017, temporary hardcode

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

// define routes
app.get(`/`, (req, res) => {
  res.render(`home`);
});

// read: displays all campgrounds
app.get(
  `/campgrounds`,
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({}); // fetches data from db
    res.render(`campgrounds/index`, { campgrounds }); // render index.ejs and pass data to it
  })
);

// create show form new campground
app.get(`/campgrounds/new`, (req, res) => {
  res.render(`campgrounds/new`);
});

// create, new submission
app.post(
  `/campgrounds`,
  catchAsync(async (req, res, next) => {
    if (!req.body.campground)
      throw new ExpressError(`Invalid Campground Data`, 400);
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

// read, display details
app.get(
  `/campgrounds/:id`,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // error handling missing
    res.render(`campgrounds/show`, { campground });
  })
);

// update: edit a campground
app.get(
  `/campgrounds/:id/edit`,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // error handling missing
    res.render(`campgrounds/edit`, { campground });
  })
);

// update: handling submissoin
app.put(
  `/campgrounds/:id`,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {
      ...req.body.campground,
    });
    res.redirect(`/campgrounds/${campground.id}`);
  })
);

app.delete(
  `/campgrounds/:id`,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect(`/campgrounds`);
  })
);

// error handler
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(`Page Not Found`, 404));
});

// error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = `Something went wrong!` } = err;
  res.status(statusCode).send(message);
});

// start the express web app, listening for requests
app.listen(3000, () => {
  console.log(`Serving on port 3000`);
});
