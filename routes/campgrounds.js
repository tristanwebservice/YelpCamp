const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");
const campgrounds = require("../controllers/campgrounds");
const multer = require("multer");
const { storage } = require(`../cloudinary`);
const upload = multer({ storage });

// show form to create new campground
router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router
  .route("/")
  // list all campgrounds
  .get(catchAsync(campgrounds.index))
  // create a new campground
  .post(
    isLoggedIn,
    upload.array(`image`),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

router
  .route("/:id")
  // show one campground
  .get(catchAsync(campgrounds.showCampground))
  // update campground
  .put(
    isLoggedIn,
    isAuthor,
    upload.array(`image`),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  // delete campground
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.destroyCampground));

// show form to edit campground
router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
