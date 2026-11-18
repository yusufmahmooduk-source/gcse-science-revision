// Tiny static file server for the exported site in out/ (no dependencies).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.env.PORT) || 3000;
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".webp": "image/webp",
};

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  const full = path.normalize(path.join(root, p));
  if (!full.startsWith(root)) return null;
  for (const c of [full, path.join(full, "index.html"), full + ".html"]) {
    try { if (fs.statSync(c).isFile()) return c; } catch {}
  }
  return null;
}

http.createServer((req, res) => {
  let file;
  try { file = resolveFile(req.url || "/"); } catch { file = null; }
  const status = file ? 200 : 404;
  file = file || path.join(root, "404.html");
  const ext = path.extname(file);
  const headers = { "Content-Type": types[ext] || "application/octet-stream", "X-Content-Type-Options": "nosniff" };
  // Hashed build files never change; everything else (pages, data) must be re-checked
  // on every visit so a new deploy can never be mixed with old cached pieces.
  headers["Cache-Control"] = file.includes(`${path.sep}_next${path.sep}static${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache";
  try {
    const st = fs.statSync(file);
    const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    headers["ETag"] = etag;
    if (req.headers["if-none-match"] === etag && status === 200) {
      res.writeHead(304, headers);
      return res.end();
    }
  } catch {}
  res.writeHead(status, headers);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).on("error", () => res.end()).pipe(res);
}).listen(port, "0.0.0.0", () => console.log(`Serving out/ on port ${port}`));
