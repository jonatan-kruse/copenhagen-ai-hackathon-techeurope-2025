import { serve } from "bun";
import index from "./index.html";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const server = serve({
  routes: {
    // Proxy all /api/* requests to the backend
    "/api/*": async (req) => {
      // Handle CORS preflight requests
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          },
        });
      }
      
      const url = new URL(req.url);
      const path = url.pathname;
      const search = url.search;
      const backendUrl = `${BACKEND_URL}${path}${search}`;
      
      try {
        // Copy headers but exclude host header
        const headers: Record<string, string> = {};
        for (const [key, value] of req.headers.entries()) {
          if (key.toLowerCase() !== "host") {
            headers[key] = value;
          }
        }
        
        const response = await fetch(backendUrl, {
          method: req.method,
          headers,
          body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
        });
        
        // Create a new response with the backend response
        const responseBody = await response.arrayBuffer();
        return new Response(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            // Allow CORS for development
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      } catch (error) {
        console.error(`Error proxying to backend: ${error}`);
        return new Response(
          JSON.stringify({ error: "Failed to connect to backend", message: error instanceof Error ? error.message : String(error) }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },

    // Serve index.html for all unmatched routes (SPA routing)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

// Server started - logs available via Bun's built-in logging
