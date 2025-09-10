const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const sendEmail = require("../utils/sendEmail");

// ✅ Check-in reminder at 10 AM
cron.schedule("0 10 * * *", async () => {
  console.log("⏰ Running check-in reminder job...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Employees who didn’t check in
  const missingCheckIns = await Attendance.find({
    date: today,
    checkIn: null,
    isCheckInReminderSent: false,
  }).populate("employee");

  for (let record of missingCheckIns) {
    await sendEmail(
      record.employee.email,
      "Reminder: Please check in",
      "You have not checked in yet today. Kindly mark your attendance."
    );

    record.isCheckInReminderSent = true;
    await record.save();
  }

  console.log(`✅ Sent ${missingCheckIns.length} check-in reminders.`);
});

// ✅ Check-out reminder at 8 PM
cron.schedule("0 20 * * *", async () => {
  console.log("⏰ Running check-out reminder job...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missingCheckOuts = await Attendance.find({
    date: today,
    checkOut: null,
    isReminderSent: false,
  }).populate("employee");

  for (let record of missingCheckOuts) {
    await sendEmail(
      record.employee.email,
      "Reminder: Please check out",
      "You forgot to check out today. Kindly update your attendance."
    );

    record.isReminderSent = true;
    await record.save();
  }

  console.log(`✅ Sent ${missingCheckOuts.length} check-out reminders.`);
});
