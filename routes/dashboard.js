const express = require("express");

const Crop = require("../models/Crop");
const Activity = require("../models/Activity");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireLogin, async (req, res, next) => {
  try {
    const farmerId = req.session.user.id;

    const crops = await Crop.find({ farmer: farmerId });

    const statusCounts = {};
    Crop.STATUSES.forEach((status) => {
      statusCounts[status] = 0;
    });
    crops.forEach((crop) => {
      statusCounts[crop.status] = statusCounts[crop.status] + 1;
    });

    // harvests due in the next 30 days
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const upcomingHarvests = await Crop.find({
      farmer: farmerId,
      status: { $in: ["Planned", "Sown", "Growing"] },
      expectedHarvestDate: { $gte: today, $lte: nextMonth }
    }).sort({ expectedHarvestDate: 1 });

    const recentActivities = await Activity.find({ farmer: farmerId })
      .sort({ date: -1 })
      .limit(5)
      .populate("crop", "name");

    let totalLandArea = 0;
    crops.forEach((crop) => {
      totalLandArea = totalLandArea + crop.landArea;
    });

    res.render("dashboard", {
      title: "Dashboard",
      statuses: Crop.STATUSES,
      statusCounts,
      totalCrops: crops.length,
      totalLandArea,
      upcomingHarvests,
      recentActivities
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
