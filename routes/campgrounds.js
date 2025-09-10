const express = require(`express`);
const router = express.Router();
const catchAsync = require(`../utils/catchAsync`);
const ExpressError = require(`../utils/ExpressError`);
const Campground = require(`../models/campground`);
const { campgroundSchema } = require(`../schemas.js`);

const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(`,`);
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

// read: displays all campgrounds
router.get(
  `/`,
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({}); // fetches data from db
    res.render(`campgrounds/index`, { campgrounds }); // render index.ejs and pass data to it
  })
);

// create show form new campground
router.get(`/new`, (req, res) => {
  res.render(`campgrounds/new`);
});

// create, new submission, validate required fields with joi
router.post(
  `/`,
  validateCampground,
  catchAsync(async (req, res, next) => {
    if (!req.body.campground)
      throw new ExpressError(`Invalid Campground Data`, 400);
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

// read, display details
router.get(
  `/:id`,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate(
      `reviews`
    ); // error handling missing
    res.render(`campgrounds/show`, { campground });
  })
);

// update: edit a campground
router.get(
  `/:id/edit`,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // error handling missing
    res.render(`campgrounds/edit`, { campground });
  })
);

// update: handling submissoin
router.put(
  `/:id`,
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {
      ...req.body.campground,
    });
    res.redirect(`/campgrounds/${campground.id}`);
  })
);

router.delete(
  `/:id`,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect(`/campgrounds`);
  })
);

module.exports = router;
