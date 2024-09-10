const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require("dotenv").config();

var daysRouter = require("./routes/days");
const indexRouter = require("./routes/index");
const itinerariesRouter = require("./routes/itineraries");
const authRouter = require("./routes/auth");

const corsOptions = {
  origin: process.env.FRONTEND_URL, // Specify your client domain
  credentials: true, // This is important for setting cookies
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 5000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/itineraries", itinerariesRouter);
app.use("/days", daysRouter);

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "secret", // Change this to a secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Serve static files (React app)
app.use(express.static(path.join(__dirname, "../client")));

// Fallback to React's index.html for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@ai-tinerary.zeh2asn.mongodb.net/cpsc455project?appName=ai-tinerary`
  )
  .then(() => {
    console.log("connected to database cluster");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });

module.exports = app;
