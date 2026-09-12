// Adds demo data so the dashboard is not empty. Run with: npm run seed

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Crop = require("./models/Crop");
const Activity = require("./models/Activity");

const DEMO_EMAIL = "farmer@demo.com";
const DEMO_PASSWORD = "farmer123";

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // clear the old demo data so this can be run again
  const existingUser = await User.findOne({ email: DEMO_EMAIL });
  if (existingUser) {
    await Crop.deleteMany({ farmer: existingUser._id });
    await Activity.deleteMany({ farmer: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
    console.log("Removed the old demo data");
  }

  const farmer = await User.create({
    name: "Ramesh Patel",
    email: DEMO_EMAIL,
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
    village: "Anand, Gujarat"
  });

  const crops = await Crop.create([
    {
      farmer: farmer._id,
      name: "Wheat",
      landArea: 4,
      sowingDate: daysFromToday(-95),
      expectedHarvestDate: daysFromToday(12),
      status: "Growing",
      expectedYield: 70,
      pricePerQuintal: 2300,
      seedCost: 9000,
      notes: "HD-2967 variety, sown after a light pre-irrigation."
    },
    {
      farmer: farmer._id,
      name: "Cotton",
      landArea: 6,
      sowingDate: daysFromToday(-130),
      expectedHarvestDate: daysFromToday(25),
      status: "Growing",
      expectedYield: 48,
      pricePerQuintal: 6800,
      seedCost: 15000,
      notes: "Pink bollworm traps installed at the field edges."
    },
    {
      farmer: farmer._id,
      name: "Mustard",
      landArea: 2.5,
      sowingDate: daysFromToday(-60),
      expectedHarvestDate: daysFromToday(55),
      status: "Growing",
      expectedYield: 22,
      pricePerQuintal: 5400,
      seedCost: 4200
    },
    {
      farmer: farmer._id,
      name: "Bajra",
      landArea: 3,
      sowingDate: daysFromToday(-190),
      expectedHarvestDate: daysFromToday(-95),
      status: "Harvested",
      expectedYield: 34,
      pricePerQuintal: 2100,
      seedCost: 3600,
      notes: "Yield was better than last season."
    },
    {
      farmer: farmer._id,
      name: "Groundnut",
      landArea: 2,
      sowingDate: daysFromToday(5),
      expectedHarvestDate: daysFromToday(120),
      status: "Planned",
      expectedYield: 26,
      pricePerQuintal: 6200,
      seedCost: 7500,
      notes: "Waiting for the field to be cleared."
    },
    {
      farmer: farmer._id,
      name: "Tomato",
      landArea: 1,
      sowingDate: daysFromToday(-150),
      expectedHarvestDate: daysFromToday(-70),
      status: "Failed",
      expectedYield: 0,
      pricePerQuintal: 0,
      seedCost: 5000,
      notes: "Lost to leaf curl virus."
    }
  ]);

  const wheat = crops[0];
  const cotton = crops[1];
  const mustard = crops[2];

  await Activity.create([
    { crop: wheat._id, farmer: farmer._id, type: "Irrigation", date: daysFromToday(-80), cost: 1200, details: "First irrigation after sowing" },
    { crop: wheat._id, farmer: farmer._id, type: "Fertilizer", date: daysFromToday(-62), cost: 3400, details: "Urea, 3 bags" },
    { crop: wheat._id, farmer: farmer._id, type: "Irrigation", date: daysFromToday(-30), cost: 1200, details: "Irrigation at grain filling stage" },
    { crop: wheat._id, farmer: farmer._id, type: "Pest Control", date: daysFromToday(-14), cost: 1800, details: "Spray for aphids" },

    { crop: cotton._id, farmer: farmer._id, type: "Fertilizer", date: daysFromToday(-100), cost: 5200, details: "DAP at the time of sowing" },
    { crop: cotton._id, farmer: farmer._id, type: "Pest Control", date: daysFromToday(-45), cost: 2600, details: "Neem based spray" },
    { crop: cotton._id, farmer: farmer._id, type: "Irrigation", date: daysFromToday(-20), cost: 1500 },

    { crop: mustard._id, farmer: farmer._id, type: "Irrigation", date: daysFromToday(-40), cost: 900, details: "Light irrigation" },
    { crop: mustard._id, farmer: farmer._id, type: "Fertilizer", date: daysFromToday(-25), cost: 1600, details: "Sulphur application" }
  ]);

  console.log("Demo data created");
  console.log(`Login with  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
