// registry.swibe.dev — Swibe Plugin Registry
// Deploy: wrangler deploy registry/worker.js
// Or: Cloudflare Pages with _worker.js

const REGISTRY = {
  version: "1.0.0",
  packages: [
    {
      name: "@bino-elgua/swibe",
      version: "3.0.6",
      description: "Sovereign Agent-Native Scripting Language",
      npm: "https://www.npmjs.com/package/@bino-elgua/swibe",
      github: "https://github.com/Bino-Elgua/Swibe",
      install: "npm i -g @bino-elgua/swibe",
      tags: ["core", "language", "compiler"]
    },
    {
      name: "@bino-elgua/swibe-openclaw",
      version: "1.0.0",
      description: "OpenClaw integration for Swibe",
      npm: "https://www.npmjs.com/package/@bino-elgua/swibe-openclaw",
      github: "https://github.com/Bino-Elgua/Swibe",
      install: "npm i @bino-elgua/swibe-openclaw",
      tags: ["openclaw", "gateway", "channels"]
    }
  ],
  plugins: [
    {
      name: "telephony",
      description: "Telnyx telephony plugin for Swibe",
      install: "swibe plugin add telephony",
      tags: ["phone", "sms", "calls"]
    },
    {
      name: "openclaw",
      description: "OpenClaw channel gateway plugin",
      install: "swibe plugin add openclaw",
      tags: ["whatsapp", "telegram", "slack"]
    }
  ]
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json"
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  // GET /
  if (path === "/" || path === "") {
    return new Response(JSON.stringify({
      name: "registry.swibe.dev",
      description: "Swibe Plugin Registry",
      version: REGISTRY.version,
      endpoints: [
        "GET /packages",
        "GET /packages/:name",
        "GET /plugins",
        "GET /plugins/:name",
        "GET /search?q=query"
      ]
    }, null, 2), { headers: CORS });
  }

  // GET /packages
  if (path === "/packages") {
    return new Response(
      JSON.stringify(REGISTRY.packages, null, 2),
      { headers: CORS }
    );
  }

  // GET /packages/:name
  if (path.startsWith("/packages/")) {
    const name = decodeURIComponent(path.slice(10));
    const pkg = REGISTRY.packages.find(
      p => p.name === name || p.name.endsWith("/" + name)
    );
    if (!pkg) {
      return new Response(
        JSON.stringify({ error: "Package not found" }),
        { status: 404, headers: CORS }
      );
    }
    return new Response(
      JSON.stringify(pkg, null, 2),
      { headers: CORS }
    );
  }

  // GET /plugins
  if (path === "/plugins") {
    return new Response(
      JSON.stringify(REGISTRY.plugins, null, 2),
      { headers: CORS }
    );
  }

  // GET /plugins/:name
  if (path.startsWith("/plugins/")) {
    const name = path.slice(9);
    const plugin = REGISTRY.plugins.find(p => p.name === name);
    if (!plugin) {
      return new Response(
        JSON.stringify({ error: "Plugin not found" }),
        { status: 404, headers: CORS }
      );
    }
    return new Response(
      JSON.stringify(plugin, null, 2),
      { headers: CORS }
    );
  }

  // GET /search?q=
  if (path === "/search") {
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const results = [
      ...REGISTRY.packages.filter(p =>
        p.name.includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      ),
      ...REGISTRY.plugins.filter(p =>
        p.name.includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      )
    ];
    return new Response(
      JSON.stringify({ query: q, results }, null, 2),
      { headers: CORS }
    );
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: CORS }
  );
}

export default {
  fetch: handleRequest
};
