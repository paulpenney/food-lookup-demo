import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { io } from "socket.io-client"; // Import socket.io-client

function App() {
  const [username, setUsername] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [socket, setSocket] = useState(null); // State to store the socket instance
  const [socketMessage, setSocketMessage] = useState(""); // State for messages from socket.io

  // Fetch CSRF token when the component mounts
  useEffect(() => {
    fetch("/csrf-token", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCsrfToken(data.csrfToken);
      })
      .catch((error) => {
        console.error("Error fetching CSRF token:", error);
      });
  }, []);

  // Check if the user is already authenticated (session active)
  useEffect(() => {
    fetch("/check-auth", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setUsername(data.username);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
        setLoading(false);
      });
  }, []);

  // Set up the socket.io connection when the component mounts
  useEffect(() => {
    const newSocket = io( {
      withCredentials: true, // Ensure credentials (cookies) are sent with the connection
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket.io server with ID:", newSocket.id);
    });

    // Listen for messages from the server
    newSocket.on("message", (msg) => {
      console.log("Message from server:", msg);
      setSocketMessage(msg);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket.io server");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    setSocket(newSocket); // Store the socket instance in state

    return () => {
      newSocket.disconnect(); // Clean up the socket connection on component unmount
    };
  }, []);

  const handleLogin = () => {
    if (username.trim() === "") {
      alert("Please enter a username");
      return;
    }

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CSRF-Token": csrfToken, // Include CSRF token in headers
      },
      credentials: "include",
      body: JSON.stringify({ username }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthenticated(true);
          // Emit a message to the socket.io server
          if (socket) {
            socket.emit("message", `User ${username} logged in`);
          }
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Error logging in:", error);
      });
  };

  const handleLogout = () => {
    fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CSRF-Token": csrfToken, // Include CSRF token in headers
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthenticated(false);
          setUsername("");
          if (socket) {
            socket.emit("message", "User logged out");
          }
        }
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  const handleCheckAuth = () => {
    fetch("/check-auth", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setIsAuthChecked(true);
        if (data.authenticated) {
          setAuthMessage(`Authenticated as ${data.username}`);
        } else {
          setAuthMessage("Not authenticated");
        }
      })
      .catch((error) => {
        console.error("Error checking authentication:", error);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        {!authenticated ? (
          <div>
            <h1>Login</h1>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        ) : (
          <div>
            <h1>Welcome, {username}!</h1>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}

        {/* New section for checking authentication status */}
        <div>
          <button onClick={handleCheckAuth}>Check Auth Status</button>
          {isAuthChecked && <p>{authMessage}</p>}
        </div>

        {/* Display socket message */}
        {socketMessage && <p>Socket Message: {socketMessage}</p>}

        <p>
          Edit <code>src/App.js</code> and save to reload
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
