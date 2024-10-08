const express = require("express");
const router = express.Router();
const { v4: uuid } = require("uuid");

const Day = require("../models/dayModel"); // Import the Day model
const Itinerary = require("../models/itineraryModel");
const User = require("../models/userModel");

const generateDay = require("../replicate/generateDay");
const debugJson = require("../replicate/debugJson");

const getAddressFromLocation = require("../google/getAddressFromLocation");
const getCoordsFromLocation = require("../google/getCoordsFromLocation");
const getImageFromSearch = require("../google/getImageFromSearch");
const retry = require("../utils/retry");
const { verifyToken } = require("../utils/jwtUtils");

// Get all days for an itinerary
router.get("/:itineraryId", verifyToken, async (req, res) => {
  const { itineraryId } = req.params;
  const userId = req.user.id;

  try {
    const itinerary = await Itinerary.findOne({ id: itineraryId });
    if (itinerary.userId !== userId)
      return res.status(403).json({ message: "Not authorized" });

    const days = await Day.find({ parentItineraryId: itineraryId });
    res.status(200).json(days);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/explore/:itineraryId", async function (req, res, next) {
  const { itineraryId } = req.params;

  try {
    const itinerary = await Itinerary.findOne({ id: itineraryId });
    if (itinerary.userId)
      return res.status(403).json({ message: "Unauthorized" });

    const days = await Day.find({ parentItineraryId: itineraryId });
    res.status(200).json(days);
  } catch (e) {
    res.status(500).json({
      message: `Getting itineraries from database failed, ${e.message}`,
    });
  }
});

// Reorder all days by itinerary id
router.post("/reorder", verifyToken, async (req, res) => {
  const { itineraryId, days } = req.body;
  const userId = req.user.id;

  try {
    const itinerary = await Itinerary.findOne({ id: itineraryId });
    if (itinerary.userId !== userId)
      return res.status(403).json({ message: "Not authorized" });

    days.forEach(async (day) => {
      await Day.updateOne(
        { parentItineraryId: day.parentItineraryId, id: day.id },
        {
          $set: {
            dayNumber: day.dayNumber,
            date: day.date,
            overview: day.overview,
            imageUrl: day.imageUrl,
            activities: day.activities,
          },
        }
      );
    });

    res.status(200).json({
      itineraryId: itineraryId,
      days,
      message: "Days reordered successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reorder all activities by day id
router.post("/activities/reorder", verifyToken, async (req, res) => {
  const { dayId, activities } = req.body;
  const userId = req.user.id;

  try {
    const day = await Day.findOne({ id: dayId });
    const itinerary = await Itinerary.findOne({ id: day.parentItineraryId });
    if (itinerary.userId !== userId)
      return res.status(403).json({ message: "Not authorized" });

    await Day.updateOne({ id: dayId }, { $set: { activities: activities } });

    res.status(200).json({
      dayId: dayId,
      activities,
      message: "activities reordered successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/generate", verifyToken, async (req, res) => {
  const { itineraryId } = req.body;
  const userId = req.user.id;
  let preferences = {};

  try {
    const itinerary = await Itinerary.findOne({ id: itineraryId });
    if (itinerary.userId !== userId)
      return res.status(403).json({ message: "Not authorized" });

    const days = await Day.find({ parentItineraryId: itineraryId });
    if (itinerary.userId) {
      const user = await User.findById(itinerary.userId);
      if (user.preferences) {
        preferences = user.preferences;
      }
    }

    const endDate = new Date(itinerary.endDate);
    const newDate = new Date(endDate).setDate(endDate.getDate() + 1);

    const currentActivities = days
      .map((day) => day.activities.map((activity) => activity.activity))
      .flat();

    const aiResponse = await retry(2, async () => {
      const jsonString = await generateDay(
        itinerary.location,
        currentActivities.join(", "),
        preferences
      );

      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.log("debugging json");
        return JSON.parse(await debugJson(jsonString));
      }
    });

    const imageUrl = await getImageFromSearch(
      `${aiResponse.activities[0].location}, ${itinerary.location}`
    );

    const newActivities = [];
    for (const [index, activity] of aiResponse.activities.entries()) {
      const address = await getAddressFromLocation(
        `${activity.location}, ${itinerary.location}`
      );
      const coordinates = await getCoordsFromLocation(
        `${activity.location}, ${itinerary.location}`
      );

      newActivities.push({
        time: activity.time,
        activity: activity.location,
        activityNumber: index + 1,
        address: address,
        coordinates: coordinates,
      });
    }

    const newDay = new Day({
      id: uuid(),
      parentItineraryId: itineraryId,
      dayNumber: days.length + 1,
      date: newDate,
      overview: `Day ${days.length + 1} in ${itinerary.location}`,
      imageUrl: imageUrl,
      activities: newActivities,
    });

    await newDay.save();
    await Itinerary.updateOne(
      { id: itineraryId },
      { $set: { endDate: newDate } }
    );
    res.status(201).send(newDay);
  } catch (e) {
    res.status(400).send(`error generating new day: ${e}`);
  }
});

// Delete a day
router.delete("/:itineraryId/:id", verifyToken, async (req, res) => {
  const { itineraryId, id } = req.params;
  const userId = req.user.id;

  try {
    const itinerary = await Itinerary.findOne({ id: itineraryId });
    if (itinerary.userId !== userId)
      return res.status(403).json({ message: "Not authorized" });

    const startDate = new Date(itinerary.startDate);
    const endDate = new Date(itinerary.endDate);

    await Day.findOneAndDelete({
      parentItineraryId: itineraryId,
      id: id,
    });

    const days = await Day.find({
      parentItineraryId: itineraryId,
    }).sort({ dayNumber: 1 });

    for (const [index, day] of days.entries()) {
      await Day.updateOne(
        { id: day.id },
        { $set: { dayNumber: index + 1, date: startDate } }
      );
      startDate.setDate(startDate.getDate() + 1);
    }

    await Itinerary.updateOne(
      { id: itineraryId },
      { $set: { endDate: endDate.setDate(endDate.getDate() - 1) } }
    );
    res.status(200).json({ message: "Day deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
