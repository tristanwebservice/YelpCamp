const express = require(`express`);
const path = require(`path`);
const mongoose = require(`mongoose`);
const Campground = require(`./models/campground`);

mongoose.connect(`mongodb://localhost:27017/yelp-camp`); // mongo listening on 27017, temporary hardcode

// error handling for db connection
const db = mongoose.connection;
db.on(`error`, console.error.bind(console, `connection error:`));
db.once(`open`, () => {
  console.log(`Database connected`);
});

const app = express();

app.set(`view engine`, `ejs`); // ejs for dynamic web pages
app.set(`views`, path.join(__dirname, `views`));

app.use(express.urlencoded({ extended: true })); //

app.get(`/`, (req, res) => {
  res.render(`home`);
});

app.get(`/campgrounds`, async (req, res) => {
  const campgrounds = await Campground.find({}); // fetches data from db
  res.render(`campgrounds/index`, { campgrounds }); // render index.ejs and pass data to it
});

// CRUD: CREATE
app.get(`/campgrounds/new`, (req, res) => {
  res.render(`campgrounds/new`);
});
app.post(`/campgrounds`, async (req, res) => {
  const campground = new Campground(req.body.campground);
  await campground.save();
  res.redirect(`/campgrounds/${campground._id}`);
});

app.get(`/campgrounds/:id`, async (req, res) => {
  const campground = await Campground.findById(req.params.id); // error handling missing
  res.render(`campgrounds/show`, { campground });
});

// start the express web app, listening for requests
app.listen(3000, () => {
  console.log(`Serving on port 3000`);
});
