// Version and Cache name will mantain a version control
const VERSION = "v2";
const CACHE_NAME = `forest-inventory-${VERSION}`;
// The static resources that the app needs to function.
const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/listado_especies.js",
  "/manifest.json",
  "/favicon.ico",
  "/libs",
  "/libs/FileSaver.min.js",
  "/libs/jszip-utils.js",
  "/libs/jszip.min.js",
  "/logos",
  "/logos/paf.svg",
  "/logos/department.svg",
  "/logos/github.svg"
];

// The install event happens when the app is used for the first time,
// or when a new version of the service worker is detected by the browser.
// When an older service worker is being replaced by a new one, the old
// service worker is used as the PWA's service worker until the new service
// work is activated.
self.addEventListener("install", (e) => {
  // The ExtendableEvent.waitUntil() method tells the browser that
  // work is ongoing until the promise settles, and it shouldn't terminate
  // the service worker if it wants that work to complete. The waitUntil
  // method is a request to the browser to not terminate the service worker
  // while a task is being executed.
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
      // The Cache.addAll() method takes an array of URLs as a parameter
      // retrieves them, then adds the responses to the given cache.
      cache.addAll(APP_STATIC_RESOURCES);
    })()
  );
});

// Use the 'activate' event to delete old caches to avoid running out of
// space. Iterate over named 'Cache' objects, deleting all but the current
// one, and then set the SW as the controller for the PWA.
// Listen for the current SW's global scope 'activate' event.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Get the names of the existing named caches with CacheStorage.keys()
      // Accessing CacheStorage through the WorkerGlobalScope.caches
      // property which returns a Promise that resolves with an array 
      // containing strings corresponding to all of the named Cache objects
      // in the order they were created.
      const names = await caches.keys();
      // Promise.all() iterates through that list of name cache promises.
      // The all() method takes as input a list of iterable promises and
      // returns a single Promise.
      await Promise.all(
        names.map((name) => {
          // For each name in the list of named caches, check if the cache is
          // the currently active cache.
          if (name !== CACHE_NAME) {
            // If not, delete it with the Cache.delete() method.
            return caches.delete(name);
          }
        }),
      );
      // The await clients.claim() uses the claim() method of the Clients
      // interface to enable our SW to set itself as the controller for our
      // client; the "client" referring to a running instance of the PWA.
      // The claim() method enables the SW to "claim control" of all clients
      // within its scope. This way, clients loaded in the same scope don't
      // need to be reloaded.
      await clients.claim();
    })(),
  );
});

// Use the fetch event to prevent an installed PWA from making requests if the
// user is online. Listening to the fetch event makes it possible to intercept
// all requests and respond with cached responses instead of going to the
// network. Most applications don't require this behavior. In fact, many
// business models want users to regularly make server requests for tracking
// and marketing purposes. So, while intercepting requests may be an
// anti-pattern for some, to improve the privacy of our app, we don't want the
// app to make unnecessary server requests.
// As this PWA consists of a single page, for page navigation requests,
// it goes back to the index.html home page. There are no other pages and it 
// never ever want to go to the server.
self.addEventListener("fetch", (event) => {
  // When seeking an HTML page, the Fetch API's Request readonly mode
  // property is 'navigate', meaning it's looking for a web page.
  if (event.request.mode === "navigate") {
    // Use the FetchEvent's respondWith() method to prevent the browser's
    // default fetch handling, providing the PWA own response promise
    // employing the caches.match() method.
    event.respondWith(caches.match("/"));
    return;
  }

  // For every other request type
  event.respondWith(
    (async () => {
      // Open the caches as done in the install event response,
      // instead passing the event request to the same match() method.
      // It checks if the request is a key for a stored Response.
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request.url);
      if (cachedResponse) {
        // Return the cached response if it's available.
        return cachedResponse;
      }
      // Respond with a HTTP 404 response status.
      // Using the Response() constructor to pass a null body and a status:
      // 404 as options, doesn't mean there is an error in our PWA. Rather,
      // everything we need should already be in the cache, and if it isn't,
      // we're not going to the server to resolve this non-issue.
      return new Response(null, { status: 404 });
    })(),
  );
});
