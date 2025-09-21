const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const { storeReturnTo } = require("../middleware");
const users = require("../controllers/users");

// Register
router
  .route("/register")
  .get(users.renderRegister) // show register form
  .post(catchAsync(users.register)); // handle registration

// Login
router
  .route("/login")
  .get(users.renderLogin) // show login form
  .post(
    storeReturnTo,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login // handle login success
  );

// Logout
router.get("/logout", catchAsync(users.logout));

module.exports = router;
