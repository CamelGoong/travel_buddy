// Travel Buddy offline helper (docs/specs/offline-documents/).
// Does two things only: shows /offline.html when a page cannot load, and serves a
// document file from this device when /trip/documents/file/<id> cannot be fetched.
// The IndexedDB names must match lib/offline-store.ts.

const SHELL_CACHE = "tb-shell-v1";
const DB_NAME = "tb-offline";
const STORE = "files";

const NOT_SAVED_HTML =
  '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  "<title>서류를 열 수 없어요</title>" +
  '<body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.6">' +
  "<h1 style=\"font-size:18px\">인터넷이 연결되면 열 수 있어요</h1>" +
  "<p>이 파일은 이 기기에 저장되어 있지 않아요.</p></body></html>";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add("/offline.html"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function readStoredFile(id) {
  return new Promise((resolve) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: "id" });
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
      get.onsuccess = () => {
        db.close();
        resolve(get.result || null);
      };
      get.onerror = () => {
        db.close();
        resolve(null);
      };
    };
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;
  const match = new URL(request.url).pathname.match(/^\/trip\/documents\/file\/(\d+)$/);

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        if (match) {
          const stored = await readStoredFile(Number(match[1]));
          if (stored) {
            return new Response(stored.blob, {
              headers: { "Content-Type": stored.contentType, "Content-Disposition": "inline" },
            });
          }
          return new Response(NOT_SAVED_HTML, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        const shell = await caches.match("/offline.html");
        return shell || Response.error();
      }
    })(),
  );
});
