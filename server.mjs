import { createServer } from "node:http";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const TARGET_ORIGIN = process.env.TARGET_ORIGIN || "https://85.239.51.66";
const TARGET = new URL(TARGET_ORIGIN);

const overlayScript = await readFile(new URL("./public/ru-overlay.js", import.meta.url), "utf8");

const injectOverlay = (html) => {
  const marker = "</head>";
  const snippet = '<script src="/__ru-overlay.js"></script>';
  if (html.includes(snippet)) return html;
  if (html.includes(marker)) return html.replace(marker, `${snippet}\n${marker}`);
  return `${snippet}\n${html}`;
};

const sanitizeHeaders = (headers) => {
  const out = { ...headers };
  delete out.host;
  delete out.origin;
  return out;
};

const server = createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  if (req.url === "/__ru-overlay.js") {
    res.writeHead(200, { "content-type": "application/javascript; charset=utf-8" });
    res.end(overlayScript);
    return;
  }

  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, target: TARGET.origin }));
    return;
  }

  const upstreamClient = TARGET.protocol === "https:" ? httpsRequest : httpRequest;
  const upstreamPath = req.url.startsWith("/") ? req.url : `/${req.url}`;
  const upstreamReq = upstreamClient(
    {
      protocol: TARGET.protocol,
      hostname: TARGET.hostname,
      port: TARGET.port || (TARGET.protocol === "https:" ? 443 : 80),
      method: req.method,
      path: upstreamPath,
      headers: {
        ...sanitizeHeaders(req.headers),
        host: TARGET.host
      },
      rejectUnauthorized: false
    },
    (upstreamRes) => {
      const chunks = [];
      upstreamRes.on("data", (chunk) => chunks.push(chunk));
      upstreamRes.on("end", () => {
        const body = Buffer.concat(chunks);
        const contentType = String(upstreamRes.headers["content-type"] || "");
        const isHtml = contentType.includes("text/html");

        if (!isHtml) {
          res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
          res.end(body);
          return;
        }

        const html = body.toString("utf8");
        const translatedHtml = injectOverlay(html);
        const headers = { ...upstreamRes.headers };
        delete headers["content-length"];
        delete headers["content-security-policy"];
        res.writeHead(upstreamRes.statusCode || 200, headers);
        res.end(translatedHtml);
      });
    }
  );

  upstreamReq.on("error", (err) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Proxy error: ${err.message}`);
  });

  req.pipe(upstreamReq);
});

server.listen(PORT, () => {
  console.log(`OpenClaw RU layer: http://localhost:${PORT}`);
  console.log(`Target origin: ${TARGET.origin}`);
});
