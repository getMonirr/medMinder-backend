const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

// env configuration
dotenv.config();

// models
const Reminder = require("./model/reminder.model");
const User = require("./model/user.model");

// create app
const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

// connected to the mongodb database
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster1.d7lse9s.mongodb.net/medMinder`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// fot testing server in root directory
app.get("/", async (req, res) => {
  res.json("MedMinder server running..");
});

// User Registration/save in the database
app.post("/api/users", async (req, res) => {
  const { name, password, email } = req.body;

  try {
    // Check if the username and email are unique
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email is already in use" });
    }

    // Create a new user
    const newUser = new User({ name, password, email });
    const result = await newUser.save();

    res.status(201).json({ message: "User registered successfully", result });
  } catch (error) {
    res.status(500).json({ error: "Registration failed", error });
  }
});

// get user by email
app.get("/api/users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "User not found", error });
  }
});

// add/post a reminder
app.post("/api/reminders", async (req, res) => {
  try {
    const { userEmail, medicationName, time, frequency, caregivers } = req.body;
    const newReminder = new Reminder({
      userEmail,
      medicationName,
      time,
      frequency,
      caregivers,
    });
    const savedReminder = await newReminder.save();
    res.status(201).json(savedReminder);
  } catch (error) {
    res.status(500).json({ error: "Failed to create a reminder", error });
    console.log({ error });
  }
});

// get all reminders and  by time. also by user email :TODO
app.get("/api/reminders", async (req, res) => {
  const time = req.query.time;
  const email = req.query.email;
  try {
    // get reminder by timestamp
    if (time) {
      const reminders = await Reminder.find({ time: { $eq: time } });
      return res.json(reminders);
    }

    // get reminder by user email
    if (email) {
      const reminders = await Reminder.find({ userEmail: email });
      return res.json(reminders);
    }

    const reminders = await Reminder.find();
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reminders" });
  }
});
// get individual reminder by id
app.get("/api/reminders/:id", async (req, res) => {
  try {
    const reminderId = req.params.id;
    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
    } else {
      res.status(200).json(reminder);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to find the reminder" });
  }
});

// update a reminder
app.put("/api/reminders/:id", async (req, res) => {
  try {
    const reminderId = req.params.id;
    const updatedReminder = req.body;
    const result = await Reminder.findByIdAndUpdate(
      reminderId,
      updatedReminder,
      { new: true }
    );
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Reminder not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update the reminder" });
  }
});

// delete a reminder
app.delete("/api/reminders/:id", async (req, res) => {
  try {
    const reminderId = req.params.id;
    const result = await Reminder.findByIdAndRemove(reminderId);
    if (result) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Reminder not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete the reminder" });
  }
});

// create transporter
const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
  secure: true,
});

// send notification
app.post("/api/reminders/notify", async (req, res) => {
  const reminderId = req.body.reminderId;
  const caregivers = req.body.caregivers;

  const reminderDetails = await Reminder.findById(reminderId);

  if (!reminderDetails) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  const message = `Time to take ${reminderDetails.medicationName}.`;

  // Send email notifications to caregivers
  caregivers.forEach(async (userEmail) => {
    const caregiver = await User.findOne({ email: userEmail });
    if (caregiver && caregiver?.email) {
      const mailOptions = {
        from: "getmonirr@gmail.com",
        to: caregiver?.email,
        subject: "Medication Reminder",
        text: message,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(`Failed to send email to caregiver: ${error}`);
        } else {
          console.log(`Email sent to caregiver: ${info.response}`);
        }
      });
    }
  });

  res.status(200).json({ message: "Notifications sent to caregivers" });
});

// start app server
app.listen(port, () => {
  console.log(`MedMinder Server is running on port ${port}`);
});
