// server/index.ts
import express from "express";

// server/routes.ts
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import path from "path";
function ensureUploadsDir() {
  const dir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
var uploadsDir = ensureUploadsDir();
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || "audio.m4a").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});
var upload = multer({ storage });
function registerRoutes(app2) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  app2.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app2.post("/api/transcribe", upload.single("file"), async (req, res) => {
    let filePath = null;
    try {
      const file = req.file;
      if (!file?.path) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      filePath = path.resolve(file.path);
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-mini-transcribe"
      });
      return res.json({ text: transcription.text || "" });
    } catch (err) {
      console.error("Transcribe error:", err);
      return res.status(500).json({ message: "Transcription failed" });
    } finally {
      try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
      }
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body || {};
      if (!Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid messages array" });
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages
      });
      const content = completion.choices?.[0]?.message?.content || "No response.";
      return res.json({ content });
    } catch (err) {
      console.error("Chat error:", err);
      return res.status(500).json({ message: "Chat failed" });
    }
  });
  const ttsCache = /* @__PURE__ */ new Map();
  app2.post("/api/speak", async (req, res) => {
    const t0 = Date.now();
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "No text provided" });
      }
      const key = text.trim();
      if (!key) {
        return res.status(400).json({ message: "No text provided" });
      }
      const cached = ttsCache.get(key);
      if (cached) {
        console.log("[TTS] cache hit ms:", Date.now() - t0, "bytes:", cached.length);
        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(cached);
      }
      const t1 = Date.now();
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: key
      });
      const t2 = Date.now();
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const t3 = Date.now();
      if (ttsCache.size > 50) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
      ttsCache.set(key, buffer);
      console.log(
        "[TTS] openai ms:",
        t2 - t1,
        "buffer ms:",
        t3 - t2,
        "total ms:",
        Date.now() - t0,
        "bytes:",
        buffer.length
      );
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(buffer);
    } catch (err) {
      console.error("Speak error:", err);
      return res.status(500).json({ message: "Speech failed" });
    }
  });
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      limit: "25mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(
    express.urlencoded({
      extended: false,
      limit: "25mb"
    })
  );
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!reqPath.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "...";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path2.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path2.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs2.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log("baseUrl", baseUrl);
  log("expsUrl", expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.path !== "/" && req.path !== "/manifest") return next();
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  app2.use(express.static(path2.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    log(`express server serving on port ${port}`);
  });
})();
