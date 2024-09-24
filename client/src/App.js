import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // New state for auth check
  const [authMessage, setAuthMessage] = useState(""); // Message from auth check
  const [csrfToken, setCsrfToken] = useState(""); // State to store CSRF token

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
        }
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  // New function to handle check auth button
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