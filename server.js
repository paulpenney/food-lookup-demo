const dotenv = require("dotenv");
const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io"); // Import socket.io

const app = express();
dotenv.config();

console.log("[server.js] process.env.NODE_ENV:", process.env.NODE_ENV);

// Set the port
app.set("port", process.env.PORT || 3001);

// Create an HTTP server to integrate with socket.io
const server = http.createServer(app);

// Initialize socket.io with CORS options
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://fooddemo-1451f28c53d9.herokuapp.com/"], // React app's URLs
    methods: ["GET", "POST"],
    credentials: true, // Enable credentials (cookies)
  },
});

app.use(express.json());

app.set("trust proxy", 1);

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://fooddemo-1451f28c53d9.herokuapp.com/"], // React app's URLs
    credentials: true, // Allow credentials like cookies (for sessions)
  })
);

// Configure session middleware
app.use(
  session({
    secret: "your-strong-secret-key", // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000, // Set cookie expiration to 24 hours
    },
  })
);

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  },
});
app.use(csrfProtection);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  console.log("[server.js] process.env.NODE_ENV is production, setting static path");
  app.use(express.static(path.join(__dirname, "client/build")));
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

    // Access cookies from the socket handshake
    const cookies = socket.handshake.headers.cookie;
    console.log("Cookies on connection:", cookies); // Log cookies when a connection is established
  

  // Example: Listen for a custom event from the client
  socket.on("message", (data) => {
    console.log("Message from client:", data);
    // Emit a message back to the client
    socket.emit("message", `Server received: ${data}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Route to handle login
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (username) {
    req.session.username = username; // Store the username in the session
    console.log("Login session:", req.session); // Log the session object
    return res.json({ success: true, message: `Logged in as ${username}` });
  }
  res.status(400).json({ success: false, message: "Username is required" });
});

// Route to check if the user is authenticated
app.get("/check-auth", (req, res) => {
  console.log("Check-auth session:", req.session); // Log the session object
  if (req.session.username) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  res.json({ authenticated: false });
});

// Route to handle logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error logging out" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Route to get the CSRF token
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Start the server
server.listen(app.get("port"), () => {
  console.log(`Server running at http://localhost:${app.get("port")}/`);
  console.log(`Node environment: ${process.env.NODE_ENV}`);
});
