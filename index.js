const express = require("express");
require("dotenv").config({ path: ".env" });
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const connectDB = require("./config/DbConnection");
const { initSocket } = require("./config/socket");

// Routes
const authRoute = require("./routes/auth");
const attendanceRoute = require("./routes/attendance");
const LeaveRoute = require("./routes/leaves");
const EmployeesRoute = require("./routes/employees");

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());

// Connect to database
connectDB();

const port = process.env.PORT || 4000;

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// API routes
app.use("/api", authRoute);
app.use("/api", attendanceRoute);
app.use("/api", LeaveRoute);
app.use("/api", EmployeesRoute);

// Initialize Socket.IO and attach to app
const io = initSocket(server);
app.set("io", io);

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
