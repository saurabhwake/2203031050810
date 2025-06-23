import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Log } from "../logger/loggingMiddleware";

export default function Redirector() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("shortenedUrls") || "[]") || [];
    const found = stored.find(u => u.shortcode === code);
    if (!found) {
      Log("frontend", "error", "redirect", `Shortcode not found: ${code}`);
      navigate("/notfound");
      return;
    }
    if (new Date() > new Date(found.expiresAt)) {
      Log("frontend", "warn", "redirect", `Shortcode expired: ${code}`);
      navigate("/expired");
      return;
    }
    const click = {
      timestamp: new Date().toISOString(),
      source: document.referrer || "direct",
      geo: "unknown", 
    };
    found.clicks.push(click);
    localStorage.setItem(
      "shortenedUrls",
      JSON.stringify(
        stored.map(u => (u.shortcode === code ? found : u))
      )
    );
    Log("frontend", "info", "redirect", `Redirected: ${code}`);
    window.location.href = found.url;
  }, [code, navigate]);

  return <div>Redirecting...</div>;
}
