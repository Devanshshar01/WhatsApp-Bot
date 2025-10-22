"use strict";
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 5173;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `http://localhost:${PORT}/callback`;

const SCOPE = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
].join(" ");

function base64url(input) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function generateCodeVerifier() {
  return base64url(crypto.randomBytes(64));
}
function generateCodeChallenge(verifier) {
  return base64url(crypto.createHash("sha256").update(verifier).digest());
}

app.get("/login", async (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).send("Missing SPOTIFY_CLIENT_ID in .env");
  }
  const state = base64url(crypto.randomBytes(16));
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  res.cookie("spotify_auth_state", state, { httpOnly: true, sameSite: "lax" });
  res.cookie("spotify_code_verifier", verifier, { httpOnly: true, sameSite: "lax" });
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: SCOPE,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

app.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies["spotify_auth_state"];
  const verifier = req.cookies["spotify_code_verifier"];
  if (!state || !savedState || state !== savedState) {
    return res.status(400).send("State mismatch");
  }
  try {
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: verifier,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const { refresh_token } = tokenRes.data;
    // Store refresh token in httpOnly cookie
    res.cookie("spotify_refresh_token", refresh_token, { httpOnly: true, sameSite: "lax" });
    // Clear auth cookies
    res.clearCookie("spotify_auth_state");
    res.clearCookie("spotify_code_verifier");
    // Redirect back to player
    res.redirect("/spotify.html");
  } catch (err) {
    console.error("Token exchange failed", err?.response?.data || err.message);
    res.status(500).send("Token exchange failed");
  }
});

app.get("/token", async (req, res) => {
  const refreshToken = req.cookies["spotify_refresh_token"];
  if (!refreshToken) return res.status(401).json({ error: "not_authorized" });
  try {
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const { access_token, expires_in } = tokenRes.data;
    res.json({ access_token, expires_in });
  } catch (err) {
    console.error("Refresh failed", err?.response?.data || err.message);
    res.status(401).json({ error: "refresh_failed" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("spotify_refresh_token");
  res.status(204).end();
});

// Static: serve the directory for assets (mp3 files and the HTML)
app.use(
  express.static(__dirname, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
    },
  })
);

// Inject spotify-integration.js into spotify.html
app.get("/", (req, res) => res.redirect("/spotify.html"));
app.get("/spotify.html", (req, res) => {
  const htmlPath = path.join(__dirname, "spotify.html");
  fs.readFile(htmlPath, "utf8", (err, data) => {
    if (err) return res.status(404).send("spotify.html not found");
    const injected = data.replace(
      "</body>",
      '<script src="/spotify-integration.js"></script></body>'
    );
    res.set("Content-Type", "text/html").send(injected);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/spotify.html`);
});
