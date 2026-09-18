// Loopback-only development preview. Published authentication files are unchanged.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8089);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/auth-config.js") {
    res.setHeader("Content-Type", types[".js"]);
    res.end('window.__SITE_PASSWORD_HASH__="";');
    return;
  }
  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }
  let name;
  try {
    name = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (name === "/" || name === "/app.html") name = "/Fieldwork.dc.html";
  if (name.endsWith("/")) name += "index.html";
  const file = path.resolve(root, "." + name);
  if (
    !file.startsWith(root + path.sep) ||
    name.includes("/.git") ||
    name.includes("/.codex")
  ) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    res.setHeader("Cache-Control", "no-store");
    // Only the loopback preview is unlocked. No password/hash is fabricated or written.
    if (path.extname(file) === ".html")
      body = body
        .toString()
        .replace(
          "<head>",
          '<head><script>sessionStorage.setItem("fs_intake_unlocked_v1","1");</script>',
        );
    res.end(body);
  });
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    "Fieldwork local preview: http://127.0.0.1:" + port + "/app.html",
  ),
);
