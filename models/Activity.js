const mongoose = require("mongoose");

const ACTIVITY_TYPES = ["Irrigation", "Fertilizer", "Pest Control"];

const activitySchema = new mongoose.Schema({
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Crop",
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ACTIVITY_TYPES,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  details: {
    type: String,
    trim: true,
    default: ""
  }
});

const Activity = mongoose.model("Activity", activitySchema);
Activity.TYPES = ACTIVITY_TYPES;

module.exports = Activity;
