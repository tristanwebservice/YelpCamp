const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const { storeReturnTo } = require(`../middleware`);

// register form
router.get("/register", (req, res) => {
  res.render("users/register");
});

// registration
router.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const { email, username, password } = req.body;
      const user = new User({ email, username });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome to Yelp Camp!");
        res.redirect("/campgrounds");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/register");
    }
  })
);

// login form
router.get("/login", (req, res) => {
  res.render("users/login");
});

// login
router.post(
  "/login",
  storeReturnTo,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    const redirectUrl = res.locals.returnTo || `/campgrounds`;
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

// logout
router.get(
  "/logout",
  catchAsync(async (req, res) => {
    await new Promise((resolve, reject) => {
      req.logout((err) => (err ? reject(err) : resolve()));
    });
    req.flash("success", "You have been signed out");
    res.redirect("/campgrounds");
  })
);

module.exports = router;
