const mongoose = require("mongoose");

const CROP_STATUSES = ["Planned", "Sown", "Growing", "Harvested", "Failed"];

const cropSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  landArea: {
    type: Number,
    required: true,
    min: 0
  },
  sowingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: CROP_STATUSES,
    default: "Planned"
  },
  expectedYield: {
    type: Number,
    default: 0,
    min: 0
  },
  pricePerQuintal: {
    type: Number,
    default: 0,
    min: 0
  },
  seedCost: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Crop = mongoose.model("Crop", cropSchema);
Crop.STATUSES = CROP_STATUSES;

module.exports = Crop;
