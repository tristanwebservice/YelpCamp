const Campground = require("../models/campground");
const { cloudinary } = require(`../cloudinary`);
const maptilerClient = require(`@maptiler/client`);
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res) => {
  if (!req.body.campground)
    throw new ExpressError("Invalid Campground Data", 400);
  const geoData = await maptilerClient.geocoding.forward(
    req.body.campground.location,
    { limit: 1 }
  );
  if (!geoData.features?.length) {
    req.flash(
      `error`,
      `Could not geocode that location. Please try a new location.`
    );
    return res.redirect(`/campgrounds/new`);
  }

  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.features[0].geometry;
  campground.location = geoData.features[0].place_name;

  if (!req.files || req.files.length === 0) {
    req.flash(`error`, `You must upload at least one image.`);
    return res.redirect(`/campgrounds/new`);
  }
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;
  await campground.save();
  console.log(campground);
  req.flash(`success`, `Successfully made a new campground!`);
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Campground not found!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Cannot find that campground");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;

  const geoData = await maptilerClient.geocoding.forward(
    req.body.campground.location,
    { limit: 1 }
  );
  if (!geoData.features?.length) {
    req.flash(
      `error`,
      `Could not geocode that location. Please try a new location.`
    );
    return res.redirect(`/campgrounds/${id}/edit`);
  }

  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });

  campground.geometry = geoData.features[0].geometry;
  campground.location = geoData.features[0].place_name;

  const totalImages = (campground.images.length || 0) + (req.files.length || 0);
  if (totalImages === 0) {
    req.flash("error", "Campground must have at least one image.");
    return res.redirect(`/campgrounds/${id}/edit`);
  }
  const imgs = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.images.push(...imgs);

  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  await campground.save();
  req.flash(`success`, `Successfully updated campground!`);
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.destroyCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash(`success`, `Successfully deleted campground!`);
  res.redirect("/campgrounds");
};
