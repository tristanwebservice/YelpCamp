const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const {
  isLoggedIn,
  isAuthor,
  validateCampground,
} = require(`../middleware.js`);

const campgrounds = require(`../controllers/campgrounds.js`);

// index
router.get("/", catchAsync(campgrounds.index));

// new form
router.get("/new", isLoggedIn, campgrounds.renderNewForm);

// create
router.post(
  "/",
  isLoggedIn,
  validateCampground,
  catchAsync(campgrounds.createCampground)
);

// show
router.get("/:id", catchAsync(campgrounds.showCampground));

// edit form
router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

// update
router.put(
  "/:id",
  isLoggedIn,
  isAuthor,
  validateCampground,
  catchAsync(campgrounds.updateCampground)
);

// delete
router.delete(
  "/:id",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.destroyCampground)
);

module.exports = router;
