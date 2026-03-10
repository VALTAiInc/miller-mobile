// server/routes.ts
import type { Express } from "express";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import path from "path";

function ensureUploadsDir() {
  const dir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const uploadsDir = ensureUploadsDir();

// IMPORTANT: preserve a real filename (with extension) so OpenAI accepts the format.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    // file.originalname from the client should be like "recording.m4a"
    const safe = (file.originalname || "audio.m4a").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage });

export function registerRoutes(app: Express) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // ================================
  // TRANSCRIBE (VOICE -> TEXT)
  // ================================
  app.post("/api/transcribe", upload.single("file"), async (req, res) => {
    let filePath: string | null = null;

    try {
      const file = (req as any).file as { path?: string; originalname?: string } | undefined;

      if (!file?.path) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      filePath = path.resolve(file.path);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-mini-transcribe",
      });

      return res.json({ text: transcription.text || "" });
    } catch (err) {
      console.error("Transcribe error:", err);
      return res.status(500).json({ message: "Transcription failed" });
    } finally {
      // Always cleanup the uploaded file
      try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  });

  // ================================
  // CHAT (TEXT -> TEXT)
  // ================================
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body || {};

      if (!Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid messages array" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

      const content = completion.choices?.[0]?.message?.content || "No response.";
      return res.json({ content });
    } catch (err) {
      console.error("Chat error:", err);
      return res.status(500).json({ message: "Chat failed" });
    }
  });

  // ================================
  // SPEAK (TEXT -> VOICE)
  // ================================
// put this near the top of routes.ts (module scope), once:
const ttsCache = new Map<string, Buffer>();

app.post("/api/speak", async (req, res) => {
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

    // 1) cache hit (instant)
    const cached = ttsCache.get(key);
    if (cached) {
      console.log("[TTS] cache hit ms:", Date.now() - t0, "bytes:", cached.length);
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(cached);
    }

    const t1 = Date.now();

    // 2) call OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: key,
    });

    const t2 = Date.now();

    const buffer = Buffer.from(await mp3.arrayBuffer());

    const t3 = Date.now();

    // keep cache from growing forever
    if (ttsCache.size > 50) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(key, buffer);

    console.log(
      "[TTS] openai ms:", t2 - t1,
      "buffer ms:", t3 - t2,
      "total ms:", Date.now() - t0,
      "bytes:", buffer.length
    );

    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(buffer);
  } catch (err) {
    console.error("Speak error:", err);
    return res.status(500).json({ message: "Speech failed" });
  }
});
  }