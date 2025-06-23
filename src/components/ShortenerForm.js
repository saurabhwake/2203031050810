import React, { useState } from "react";
import { Log } from "../logger/loggingMiddleware";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Box,
  Link,
  Divider,
} from "@mui/material";

const MAX_URLS = 5;
const DEFAULT_VALIDITY = 30;

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidShortcode(str) {
  return /^[a-zA-Z0-9]{4,16}$/.test(str);
}

function generateRandomShortcode() {
  return Math.random().toString(36).slice(2, 8);
}

export default function ShortenerForm({ onShortened }) {
  const [inputs, setInputs] = useState(
    Array(MAX_URLS).fill({ url: "", validity: "", shortcode: "" })
  );
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState([]);

  function handleChange(idx, field, value) {
    const updated = [...inputs];
    updated[idx] = { ...updated[idx], [field]: value };
    setInputs(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let hasError = false;
    const newErrors = [];
    const newResults = [];
    const usedShortcodes = new Set(
      (JSON.parse(localStorage.getItem("shortenedUrls") || "[]") || []).map(
        (u) => u.shortcode
      )
    );
    for (let i = 0; i < MAX_URLS; i++) {
      const { url, validity, shortcode } = inputs[i];
      if (!url) continue;
      if (!isValidUrl(url)) {
        newErrors[i] = "Invalid URL format";
        await Log("frontend", "error", "validation", `Malformed URL: ${url}`);
        hasError = true;
        continue;
      }
      let validPeriod = parseInt(validity, 10);
      if (validity && (isNaN(validPeriod) || validPeriod <= 0)) {
        newErrors[i] = "Validity must be a positive number";
        await Log(
          "frontend",
          "error",
          "validation",
          `Invalid validity: ${validity}`
        );
        hasError = true;
        continue;
      }
      let code = shortcode || generateRandomShortcode();
      if (shortcode && !isValidShortcode(shortcode)) {
        newErrors[i] = "Shortcode must be 4-16 letters or numbers";
        await Log(
          "frontend",
          "error",
          "validation",
          `Invalid shortcode: ${shortcode}`
        );
        hasError = true;
        continue;
      }
      if (usedShortcodes.has(code)) {
        newErrors[i] = "Shortcode already used";
        await Log(
          "frontend",
          "error",
          "validation",
          `Shortcode collision: ${code}`
        );
        hasError = true;
        continue;
      }
      usedShortcodes.add(code);
      const now = new Date();
      const expiry = new Date(
        now.getTime() + 60000 * (validPeriod || DEFAULT_VALIDITY)
      );
      const result = {
        url,
        shortcode: code,
        createdAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
        clicks: [],
      };
      newResults.push(result);
      await Log(
        "frontend",
        "info",
        "shortener",
        `Shortened URL: ${url} -> ${code}`
      );
    }
    setErrors(newErrors);
    if (!hasError && newResults.length) {
      const prev =
        JSON.parse(localStorage.getItem("shortenedUrls") || "[]") || [];
      localStorage.setItem(
        "shortenedUrls",
        JSON.stringify([...prev, ...newResults])
      );
      setResults(newResults);
      if (onShortened) onShortened(newResults);
    } else {
      setResults([]);
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: 4,
        borderRadius: 2,
        background: "#f9f9fb",
        maxWidth: 900,
        width: "100%",
        mx: "auto",
        boxSizing: "border-box",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: "#00bcd4",
          fontSize: { xs: "1.4rem", sm: "2rem" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        URL Shortener
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{
          mb: 2,
          color: "#616161",
          fontSize: { xs: "1rem", sm: "1.15rem" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        Paste up to {MAX_URLS} URLs and get short links instantly!
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {inputs.map((input, idx) => (
            <React.Fragment key={idx}>
              <Grid item xs={12} sm={5} md={5}>
                <TextField
                  fullWidth
                  label="Long URL"
                  value={input.url}
                  onChange={(e) => handleChange(idx, "url", e.target.value)}
                  error={!!errors[idx]}
                  helperText={errors[idx]}
                  autoComplete="off"
                  variant="outlined"
                  size="small"
                  sx={{
                    background: "#fff",
                    borderRadius: 1,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3} md={3}>
                <TextField
                  fullWidth
                  label="Validity (min, optional)"
                  value={input.validity}
                  onChange={(e) =>
                    handleChange(idx, "validity", e.target.value)
                  }
                  autoComplete="off"
                  variant="outlined"
                  size="small"
                  sx={{
                    background: "#e0f7fa",
                    borderRadius: 1,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <TextField
                  fullWidth
                  label="Custom Shortcode (optional)"
                  value={input.shortcode}
                  onChange={(e) =>
                    handleChange(idx, "shortcode", e.target.value)
                  }
                  autoComplete="off"
                  variant="outlined"
                  size="small"
                  sx={{
                    background: "#fff",
                    borderRadius: 1,
                  }}
                />
              </Grid>
              {idx < inputs.length - 1 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: "#b2ebf2" }} />
                </Grid>
              )}
            </React.Fragment>
          ))}
          <Grid item xs={12} sx={{ textAlign: { xs: "center", sm: "right" }, mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                background: "#00bcd4",
                color: "#fff",
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  background: "#00838f",
                },
              }}
            >
              Shorten URLs
            </Button>
          </Grid>
        </Grid>
      </form>
      {results.length > 0 && (
        <Box mt={4}>
          <Typography
            variant="h6"
            sx={{
              color: "#00bcd4",
              mb: 2,
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.3rem" },
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Shortened URLs
          </Typography>
          <Grid container spacing={2}>
            {results.map((res, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    background: "#e0f7fa",
                    borderLeft: "4px solid #00bcd4",
                  }}
                >
                  <div>
                    <strong style={{ color: "#00838f" }}>Original:</strong>{" "}
                    <Link
                      href={res.url}
                      target="_blank"
                      rel="noopener"
                      underline="hover"
                      sx={{ color: "#222" }}
                    >
                      {res.url}
                    </Link>
                  </div>
                  <div>
                    <strong style={{ color: "#00bcd4" }}>Short URL:</strong>{" "}
                    <Link
                      href={`/${res.shortcode}`}
                      target="_blank"
                      rel="noopener"
                      underline="hover"
                      sx={{
                        fontWeight: 600,
                        color: "#00838f",
                      }}
                    >
                      {window.location.origin}/{res.shortcode}
                    </Link>
                  </div>
                  <div>
                    <strong style={{ color: "#00838f" }}>Expires:</strong>{" "}
                    <span style={{ color: "#333" }}>
                      {new Date(res.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
}
