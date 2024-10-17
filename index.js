const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT1 || 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "ba365df8",
  password: "Cab#22se",
  database: "ba365df8",
});

var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.EMAIL_USERNAME, // Use the email credentials from .env file
    pass: process.env.EMAIL_PASSWORD,
  }
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL");
    createTable();
    setupEmailReminderJob();

    app.use(express.static(path.join(__dirname, 'public')));
  }
});

// Function to create 'reminders' table
function createTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reminderMsg VARCHAR(255) NOT NULL,
      remindAt DATETIME NOT NULL,
      isReminded BOOLEAN DEFAULT false
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating reminders table:', err);
    } else {
      console.log('Reminders table created or already exists');
    }
  });
}

// API Endpoint for Adding Reminders (/addReminder)
app.post("/addReminder", (req, res) => {
  const { reminderMsg, remindAt } = req.body;

  const insertQuery = `
    INSERT INTO reminders (reminderMsg, remindAt, isReminded)
    VALUES (?, ?, ?)
  `;

  db.query(insertQuery, [reminderMsg, new Date(remindAt), false], (err, result) => {
    if (err) {
      console.error('Error adding reminder:', err);
      res.status(500).json({ success: false, error: 'Error adding reminder' });
    } else {
      const insertedId = result.insertId;
      console.log('Reminder added successfully with ID:', insertedId);

      res.status(200).json({
        success: true,
        reminder: {
          id: insertedId,
          reminderMsg,
          remindAt: new Date(remindAt),
          isReminded: false
        }
      });
    }
  });
});

// API Endpoint for Getting All Reminders (/getAllReminder)
app.get("/getAllReminder", (req, res) => {
  const getAllQuery = `
    SELECT * FROM reminders
  `;

  db.query(getAllQuery, (err, result) => {
    if (err) {
      console.error('Error getting reminders:', err);
      res.status(500).json({ success: false, error: 'Error getting reminders' });
    } else {
      console.log('Reminders retrieved successfully');
      res.status(200).json(result);
    }
  });
});

// Function to fetch and dispatch reminders
function sendReminders() {
  const getPendingRemindersQuery = `
    SELECT * FROM reminders
    WHERE isReminded = false AND remindAt <= NOW()
  `;

  db.query(getPendingRemindersQuery, (err, reminders) => {
    if (err) {
      console.error('Error fetching reminders:', err);
      res.status(500).json({ success: false, error: 'Error fetching reminders' });
    } else {
      console.log('Reminders fetched successfully:', reminders);

      reminders.forEach((reminder) => {
        sendEmailReminder(reminder);
      });
    }
  });
}

// Function to send email reminders
function sendEmailReminder(reminder) {
  const mailOptions = {
    from: 'hicounselor@gmail.com',
    to: 'test@mailtrap.io',
    subject: 'Node Mailer',
    text: `${reminder.reminderMsg} - Due Date: ${new Date(reminder.remindAt).toLocaleString()}`
  };

  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
      markReminderAsSent(reminder.id);
    }
  });
}

// Function to mark a reminder as sent
function markReminderAsSent(reminderId) {
  const updateQuery = `
    UPDATE reminders
    SET isReminded = true
    WHERE id = ?
  `;

  db.query(updateQuery, [reminderId], (err, result) => {
    if (err) {
      console.error('Error updating reminder:', err);
    } else {
      console.log('Reminder marked as sent');
    }
  });
}

// Function to set up scheduled email reminder job
function setupEmailReminderJob() {
  cron.schedule("* * * * *", () => {
    sendReminders();
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
