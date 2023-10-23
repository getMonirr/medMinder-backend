const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
  },
  medicationName: String,
  time: String,
  frequency: String,
  caregivers: [String],
});
// mongoose.deleteModel("Reminders", reminderSchema);
const Reminder =
  mongoose.models.Reminders || mongoose.model("Reminder", reminderSchema);

module.exports = Reminder;
