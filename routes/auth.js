const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { redirectIfLoggedIn } = require("../middleware/auth");

const router = express.Router();

// Landing page
router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("home", { title: "Smart Crop Management System" });
});

// ---------- Register ----------
router.get("/register", redirectIfLoggedIn, (req, res) => {
  res.render("register", { title: "Create account", form: {}, error: null });
});

router.post("/register", redirectIfLoggedIn, async (req, res, next) => {
  const { name, email, password, confirmPassword, village } = req.body;
  const form = { name, email, village };

  try {
    if (!name || !email || !password) {
      return res.status(400).render("register", {
        title: "Create account",
        form,
        error: "Name, email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).render("register", {
        title: "Create account",
        form,
        error: "Password must be at least 6 characters long."
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render("register", {
        title: "Create account",
        form,
        error: "The two passwords do not match."
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).render("register", {
        title: "Create account",
        form,
        error: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      village
    });

    req.session.user = { id: user._id, name: user.name, email: user.email };
    req.session.flash = {
      type: "success",
      message: `Welcome, ${user.name}! Your account is ready.`
    };
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

// ---------- Login ----------
router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("login", { title: "Login", form: {}, error: null });
});

router.post("/login", redirectIfLoggedIn, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: (email || "").toLowerCase() });

    // same message for both, so registered emails cannot be guessed
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).render("login", {
        title: "Login",
        form: { email },
        error: "Invalid email or password."
      });
    }

    req.session.user = { id: user._id, name: user.name, email: user.email };
    req.session.flash = {
      type: "success",
      message: `Welcome back, ${user.name}.`
    };
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

// ---------- Logout ----------
router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

module.exports = router;
