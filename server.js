require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");

const authRoutes = require("./routes/auth");
const cropRoutes = require("./routes/crops");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });

// ---------- App setup ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

// available in every ejs file
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// ---------- Routes ----------
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/crops", cropRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page not found",
    message: "The page you are looking for does not exist."
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again."
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
