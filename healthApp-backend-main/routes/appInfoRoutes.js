const express = require("express");
const AppInfo = require("../models/appInfoModel");

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { privacyPolicy, faq, about } = req.body;

    // Find existing App Info
    let appInfo = await AppInfo.findOne();

    if (appInfo) {
      // Update existing record
      appInfo.privacyPolicy = privacyPolicy || appInfo.privacyPolicy;
      appInfo.faq = faq || appInfo.faq;
      appInfo.about = about || appInfo.about;
    } else {
      // Create new record
      appInfo = new AppInfo({ privacyPolicy, faq, about });
    }

    await appInfo.save();
    res.json({ message: "App Info saved successfully", appInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/get", async (req, res) => {
  try {
    const appInfo = await AppInfo.findOne();
    if (!appInfo) return res.status(404).json({ message: "No App Info found" });

    res.json(appInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    await AppInfo.deleteMany({});
    res.json({ message: "App Info deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
