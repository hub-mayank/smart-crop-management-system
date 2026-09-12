const express = require("express");
const mongoose = require("mongoose");

const Crop = require("../models/Crop");
const Activity = require("../models/Activity");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.use(requireLogin);

// ---------- List, search and filter ----------
router.get("/", async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = { farmer: req.session.user.id };

    if (status && Crop.STATUSES.includes(status)) {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const crops = await Crop.find(query).sort({ sowingDate: -1 });

    res.render("crops/index", {
      title: "My crops",
      crops,
      statuses: Crop.STATUSES,
      selectedStatus: status || "",
      search: search || ""
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Add a new crop ----------
router.get("/new", (req, res) => {
  res.render("crops/form", {
    title: "Add crop",
    crop: {},
    statuses: Crop.STATUSES,
    action: "/crops",
    error: null
  });
});

router.post("/", async (req, res, next) => {
  try {
    await Crop.create(buildCropData(req));

    req.session.flash = { type: "success", message: "Crop added successfully." };
    res.redirect("/crops");
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).render("crops/form", {
        title: "Add crop",
        crop: req.body,
        statuses: Crop.STATUSES,
        action: "/crops",
        error: "Please fill in all the required fields correctly."
      });
    }
    next(err);
  }
});

// placed after /new so that /crops/new is not read as an id
router.use("/:id", (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return renderNotFound(res);
  }
  next();
});

// ---------- Crop details and activity log ----------
router.get("/:id", async (req, res, next) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.session.user.id
    });

    if (!crop) {
      return renderNotFound(res);
    }

    const activities = await Activity.find({ crop: crop._id }).sort({ date: -1 });

    // ---- Yield / cost estimate ----
    let activityCost = 0;
    activities.forEach((activity) => {
      activityCost = activityCost + activity.cost;
    });

    const totalCost = crop.seedCost + activityCost;
    const estimatedIncome = crop.expectedYield * crop.pricePerQuintal;

    const estimate = {
      activityCost,
      totalCost,
      estimatedIncome,
      estimatedProfit: estimatedIncome - totalCost
    };

    res.render("crops/show", {
      title: crop.name,
      crop,
      activities,
      activityTypes: Activity.TYPES,
      estimate
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Edit a crop ----------
router.get("/:id/edit", async (req, res, next) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.session.user.id
    });

    if (!crop) {
      return renderNotFound(res);
    }

    res.render("crops/form", {
      title: "Edit crop",
      crop,
      statuses: Crop.STATUSES,
      action: `/crops/${crop._id}/update`,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/update", async (req, res, next) => {
  try {
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, farmer: req.session.user.id },
      buildCropData(req),
      { runValidators: true }
    );

    if (!crop) {
      return renderNotFound(res);
    }

    req.session.flash = { type: "success", message: "Crop updated successfully." };
    res.redirect(`/crops/${crop._id}`);
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).render("crops/form", {
        title: "Edit crop",
        crop: { ...req.body, _id: req.params.id },
        statuses: Crop.STATUSES,
        action: `/crops/${req.params.id}/update`,
        error: "Please fill in all the required fields correctly."
      });
    }
    next(err);
  }
});

// ---------- Delete a crop ----------
router.post("/:id/delete", async (req, res, next) => {
  try {
    const crop = await Crop.findOneAndDelete({
      _id: req.params.id,
      farmer: req.session.user.id
    });

    if (!crop) {
      return renderNotFound(res);
    }

    await Activity.deleteMany({ crop: crop._id });

    req.session.flash = { type: "success", message: "Crop deleted." };
    res.redirect("/crops");
  } catch (err) {
    next(err);
  }
});

// ---------- Log an activity for a crop ----------
router.post("/:id/activities", async (req, res, next) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.session.user.id
    });

    if (!crop) {
      return renderNotFound(res);
    }

    await Activity.create({
      crop: crop._id,
      farmer: req.session.user.id,
      type: req.body.type,
      date: req.body.date,
      cost: Number(req.body.cost) || 0,
      details: req.body.details
    });

    req.session.flash = { type: "success", message: "Activity logged." };
    res.redirect(`/crops/${crop._id}`);
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      req.session.flash = {
        type: "error",
        message: "Please choose an activity type and a date."
      };
      return res.redirect(`/crops/${req.params.id}`);
    }
    next(err);
  }
});

router.post("/:id/activities/:activityId/delete", async (req, res, next) => {
  try {
    await Activity.findOneAndDelete({
      _id: req.params.activityId,
      farmer: req.session.user.id
    });

    req.session.flash = { type: "success", message: "Activity removed." };
    res.redirect(`/crops/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

function buildCropData(req) {
  return {
    farmer: req.session.user.id,
    name: req.body.name,
    landArea: Number(req.body.landArea) || 0,
    sowingDate: req.body.sowingDate,
    expectedHarvestDate: req.body.expectedHarvestDate,
    status: req.body.status,
    expectedYield: Number(req.body.expectedYield) || 0,
    pricePerQuintal: Number(req.body.pricePerQuintal) || 0,
    seedCost: Number(req.body.seedCost) || 0,
    notes: req.body.notes
  };
}

function renderNotFound(res) {
  return res.status(404).render("error", {
    title: "Crop not found",
    message: "This crop does not exist or does not belong to your account."
  });
}

module.exports = router;
