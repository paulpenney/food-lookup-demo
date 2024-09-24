const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const app = express();

// Set the port
app.set("port", process.env.PORT || 3001);

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:3000', // Your React app's URL
  credentials: true // Allow credentials like cookies (for sessions)
}));

// Configure session middleware
app.use(session({
  secret: 'your-strong-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    httpOnly: true,
    sameSite: 'Strict', // Add SameSite attribute
    maxAge: 24 * 60 * 60 * 1000 // Set cookie expiration to 24 hours
  }
}));

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
}

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
  console.log("Raw cookies (check-auth):", req.headers.cookie); // Log the raw cookies
  console.log("Check-auth session:", req.session); // Log the session object
  if (req.session.username) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  res.json({ authenticated: false });
});

// Route to handle logout
app.post("/logout", (req, res) => {
  console.log("Raw cookies (logout):", req.headers.cookie); // Log the raw cookies
  console.log("Logout session before destroy:", req.session); // Log the session object before destroying
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error logging out" });
    }
    console.log("Logout session after destroy:", req.session); // Log the session object after destroying
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Route to get the CSRF token
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Start the server
app.listen(app.get("port"), () => {
  console.log(`Server running at http://localhost:${app.get("port")}/`);
  console.log(`Node environment: ${process.env.NODE_ENV}`);
});