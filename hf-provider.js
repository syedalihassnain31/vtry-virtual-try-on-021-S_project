// Free, open-source virtual try-on via a public Hugging Face Space (default: IDM-VTON).
// Talks to the Space's Gradio HTTP API directly, so no extra npm packages are needed.
const fs = require("fs");
const path = require("path");

const SPACE_URL = (process.env.HF_SPACE_URL || "https://yisol-idm-vton.hf.space").replace(/\/$/, "");
const HF_TOKEN = process.env.HF_TOKEN || "";
const API_NAME = process.env.HF_API_NAME || "tryon";
const DENOISE_STEPS = Number(process.env.HF_DENOISE_STEPS || 30);
const TIMEOUT_MS = Number(process.env.HF_TIMEOUT_MS || 5 * 60 * 1000);

const headers = () => (HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {});

async function getPrefix() {
  // Gradio 5 serves its API under /gradio_api, Gradio 4 under the root.
  try {
    const r = await fetch(`${SPACE_URL}/config`, { headers: headers() });
    if (r.ok) return (await r.json()).api_prefix || "";
  } catch (_) {}
  return "";
}

async function uploadFile(base, filePath, name, mime) {
  const form = new FormData();
  form.append("files", new Blob([fs.readFileSync(filePath)], { type: mime }), name);
  const r = await fetch(`${base}/upload`, { method: "POST", headers: headers(), body: form });
  if (!r.ok) throw new Error(`Upload to AI Space failed (${r.status}).`);
  const out = await r.json();
  return { path: out[0], orig_name: name, meta: { _type: "gradio.FileData" } };
}

async function readEvent(res) {
  // Parse the server-sent-event stream until a "complete" or "error" event.
  const text = await res.text();
  let event = "";
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) {
      const data = line.slice(5).trim();
      if (event === "complete") return JSON.parse(data);
      if (event === "error") throw new Error(data && data !== "null" ? `AI Space error: ${data}` : "The AI Space reported an error (GPU quota or queue). Try again shortly.");
    }
  }
  throw new Error("AI Space returned no result.");
}

async function hfTryOn(person, outfit) {
  const prefix = await getPrefix();
  const base = `${SPACE_URL}${prefix}`;
  const [personFile, outfitFile] = await Promise.all([
    uploadFile(base, person.path, person.originalname || "person.jpg", person.mimetype),
    uploadFile(base, outfit.path, outfit.originalname || "garment.jpg", outfit.mimetype),
  ]);
  const payload = {
    data: [
      { background: personFile, layers: [], composite: null }, // ImageEditor value
      outfitFile,                                              // garment image
      "a garment",                                             // garment description
      true,                                                    // auto-masking
      false,                                                   // auto-crop & resize
      DENOISE_STEPS,
      42,                                                      // seed
    ],
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const start = await fetch(`${base}/call/${API_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers() },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!start.ok) throw new Error(`AI Space rejected the request (${start.status}). It may be sleeping or busy.`);
    const { event_id } = await start.json();
    const stream = await fetch(`${base}/call/${API_NAME}/${event_id}`, { headers: headers(), signal: ctrl.signal });
    if (!stream.ok) throw new Error(`Could not read AI Space result (${stream.status}).`);
    const result = await readEvent(stream);
    const file = result[0];
    const url = file.url || `${base}/file=${file.path}`;
    const img = await fetch(url, { headers: headers(), signal: ctrl.signal });
    if (!img.ok) throw new Error("Could not download the generated image.");
    const mime = img.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${Buffer.from(await img.arrayBuffer()).toString("base64")}`;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("AI generation timed out. The free Space may be busy; try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { hfTryOn };
