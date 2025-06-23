import React, { useEffect, useState } from "react";
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Link, Box } from "@mui/material";
import { Log } from "../logger/loggingMiddleware";

export default function ShortenerStats() {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("shortenedUrls") || "[]") || [];
    setUrls(stored);
    Log("frontend", "info", "stats", "Loaded statistics page");
  }, []);

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>Shortened URLs & Statistics</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Short URL</TableCell>
            <TableCell>Original URL</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Expires At</TableCell>
            <TableCell>Clicks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {urls.map((u, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Link href={`/${u.shortcode}`} target="_blank" rel="noopener">
                  {window.location.origin}/{u.shortcode}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={u.url} target="_blank" rel="noopener">{u.url}</Link>
              </TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(u.expiresAt).toLocaleString()}</TableCell>
              <TableCell>
                {u.clicks.length}
                <Box>
                  {u.clicks.map((c, i) => (
                    <div key={i} style={{ fontSize: "0.9em", marginLeft: 8 }}>
                      {new Date(c.timestamp).toLocaleString()} | {c.source} | {c.geo}
                    </div>
                  ))}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
