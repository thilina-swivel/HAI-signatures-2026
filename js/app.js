(function () {
// List of employees -> per-person signature page. The person picks their email
// client first; that choice drives the markup, the buttons and the steps.


const {
  EMPLOYEES, TARGETS, TARGET_ORDER, DEFAULT_TARGET, FILES_DIR,
  buildSignature, buildPlainText, buildDocument,
  photoFor, esc, slug, zip, bytesFromDataUri,
} = window.HAI;

const $ = (id) => document.getElementById(id);
const listView = $("view-list");
const detailView = $("view-detail");
const peopleEl = $("people");
const searchEl = $("search");
const noResults = $("no-results");
const frameEl = $("sig-frame");
const tabsEl = $("tabs");
const actionsEl = $("actions");
const hintEl = $("hint");
const stepsEl = $("steps");
const noteEl = $("note");
const toastEl = $("toast");

// Give everyone a stable url id, keeping duplicates apart (two "Sandaru"s etc).
const seen = new Map();
const people = EMPLOYEES.map((person) => {
  let id = slug(person.name);
  const count = (seen.get(id) || 0) + 1;
  seen.set(id, count);
  if (count > 1) id = `${id}-${count}`;
  return { ...person, id };
});

let current = null;

/* ------------------------------ target ---------------------------------- */

// Remembered per browser: people install their signature once, but they come
// back when their details change, and they are still on the same client.
const STORE_KEY = "hai.target";

function loadTarget() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && TARGETS[saved]) return saved;
  } catch (err) {
    /* private window, blocked storage - fall through to the default */
  }
  return DEFAULT_TARGET;
}

let targetId = loadTarget();

function setTarget(id) {
  if (!TARGETS[id]) return;
  targetId = id;
  try {
    localStorage.setItem(STORE_KEY, id);
  } catch (err) {
    /* nothing to do - the choice just will not survive a reload */
  }
  renderTabs();
  if (current) renderTargetParts(current);
}

function renderTabs() {
  tabsEl.innerHTML = TARGET_ORDER.map((id) => {
    const t = TARGETS[id];
    const on = id === targetId;
    return `
      <button class="tab${on ? " on" : ""}" role="tab" aria-selected="${on}" data-target="${id}">
        <span class="tab-label">${esc(t.label)}</span>
        <span class="tab-blurb">${esc(t.blurb)}</span>
      </button>`;
  }).join("");
}

tabsEl.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-target]");
  if (tab) setTarget(tab.dataset.target);
});

/* ------------------------------- list ---------------------------------- */

function cardHtml(person) {
  const subtitle = person.title
    ? `<div class="card-title">${esc(person.title)}</div>`
    : `<span class="badge">Details pending</span>`;
  return `
    <a class="card" href="#/${person.id}">
      <img class="card-photo" src="${photoFor(person)}" alt="" width="46" height="46">
      <div class="card-body">
        <div class="card-name">${esc(person.name)}</div>
        ${subtitle}
      </div>
    </a>`;
}

function renderList(query = "") {
  const q = query.trim().toLowerCase();
  const matches = people.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || String(p.title || "").toLowerCase().includes(q)
  );

  noResults.hidden = matches.length > 0;

  // Group by team, but only once teams are actually in use.
  const teams = [...new Set(matches.map((p) => p.team).filter(Boolean))];
  if (!teams.length || q) {
    peopleEl.innerHTML = `<div class="grid">${matches.map(cardHtml).join("")}</div>`;
    return;
  }

  const sections = teams.map((team) => {
    const members = matches.filter((p) => p.team === team);
    return `<h2 class="team-label">${esc(team)}</h2><div class="grid">${members.map(cardHtml).join("")}</div>`;
  });
  const rest = matches.filter((p) => !p.team);
  if (rest.length) {
    sections.push(`<h2 class="team-label">Everyone else</h2><div class="grid">${rest.map(cardHtml).join("")}</div>`);
  }
  peopleEl.innerHTML = sections.join("");
}

/* ------------------------------ detail --------------------------------- */

function renderDetail(person) {
  current = person;
  document.title = `${person.name} - humaniseAI Email Signature`;
  $("detail-photo").src = photoFor(person);
  $("detail-name").textContent = person.name;
  $("detail-title").textContent = person.title || "Details pending";
  renderTabs();
  renderTargetParts(person);
}

/** Everything that changes when the chosen client changes. */
function renderTargetParts(person) {
  const target = TARGETS[targetId];
  paintSignature(person);
  renderActions(target);
  stepsEl.innerHTML = target.steps.map((step) => `<li>${step}</li>`).join("");
  noteEl.innerHTML = target.note;
  // The pasted builds have no download to fall back on, so they have no hint.
  hintEl.hidden = target.delivery !== "zip";
  hintEl.innerHTML = hintEl.hidden
    ? ""
    : `The preview shows the real layout. In the package the images are separate files inside <code>${FILES_DIR}</code>, which is what keeps them sharp in classic Outlook.`;
}

/**
 * The full-size original, as a data URI. Each lives in its own generated
 * js/photos-full/<id>.js, pulled in with a <script> tag on first click: that
 * works straight off disk, where fetch() is blocked and <a download> only
 * opens the image. Kept out of js/photos.js, which every visit loads.
 */
const fullPhotos = new Map();

HAI.onFullPhoto = (id, uri) => fullPhotos.get(id)?.resolve(uri);

function loadFullPhoto(id) {
  if (!fullPhotos.has(id)) {
    let resolve;
    const promise = new Promise((done, fail) => {
      resolve = done;
      const script = document.createElement("script");
      script.src = `js/photos-full/${encodeURIComponent(id)}.js`;
      script.onerror = () => { fullPhotos.delete(id); fail(new Error(`no full photo for ${id}`)); };
      document.head.appendChild(script);
    });
    fullPhotos.set(id, { promise, resolve });
  }
  return fullPhotos.get(id).promise;
}

function renderActions(target) {
  actionsEl.innerHTML = target.delivery === "zip"
    ? `<button class="btn btn-primary" data-act="zip">
         <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2v9.6l3.3-3.3 1.4 1.4-5.7 5.7-5.7-5.7 1.4-1.4L8 11.6V2h2zM3 16h14v2H3v-2z"/></svg>
         Download package (.zip)
       </button>
       <button class="btn" data-act="html">Download .htm only</button>`
    : `<button class="btn btn-primary" data-act="copy">
         <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 2h9a2 2 0 012 2v10h-2V4H7V2zM4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm0 2v8h9V8H4z"/></svg>
         Copy signature
       </button>
       <button class="btn" data-act="photo">Download profile photo</button>`;
}

/**
 * Write the signature into the iframe as a standalone document - the same thing
 * you get by opening the .html file on its own. Nothing from this page's
 * stylesheet reaches it, so a copy carries the signature's inline styles only.
 *
 * The preview always embeds its images, whatever the target does: an iframe has
 * no folder next to it, so the Windows build's relative paths would show as
 * broken images here. The width and the Outlook conditionals still differ, so
 * the preview remains an honest picture of each build's layout.
 */
function paintSignature(person) {
  const doc = frameEl.contentDocument;
  doc.open();
  doc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="x-apple-disable-message-reformatting"></head>' +
      '<body style="margin:0;padding:0;background:#ffffff;">' +
      buildSignature(person, { target: targetId, imageMode: "data" }) +
      "</body></html>"
  );
  doc.close();
  fitFrame(doc);
}

// The iframe cannot size itself, so match its height to the signature once the
// images have decoded (they are data URIs, but decoding is still asynchronous).
function fitFrame(doc) {
  const resize = () => {
    frameEl.style.height = Math.max(doc.body.scrollHeight, 120) + "px";
  };
  resize();
  Promise.all(
    [...doc.images].map((img) =>
      img.complete ? null : new Promise((done) => { img.onload = img.onerror = done; })
    )
  ).then(resize);
}

// Registered once, not per person, so navigating between people leaves no
// listeners behind.
window.addEventListener("resize", () => {
  const doc = frameEl.contentDocument;
  if (doc && doc.body) frameEl.style.height = Math.max(doc.body.scrollHeight, 120) + "px";
});

/* ------------------------------- copy ---------------------------------- */

/**
 * Copy the *rendered* signature. Selecting the live node and letting the browser
 * serialise it is what preserves the images - a raw text/html string with data:
 * URIs is only the fallback, since some clients drop those on paste.
 */
async function copySignature() {
  const doc = frameEl.contentDocument;
  const frameWindow = frameEl.contentWindow;

  // Select inside the iframe and copy from there - the clipboard then holds the
  // bare signature, exactly as if the .html file had been opened and Ctrl+A'd.
  frameWindow.focus();
  const selection = frameWindow.getSelection();
  const range = doc.createRange();
  range.selectNodeContents(doc.body);
  selection.removeAllRanges();
  selection.addRange(range);

  let copied = false;
  try {
    copied = doc.execCommand("copy");
  } catch (err) {
    copied = false;
  }
  selection.removeAllRanges();
  window.focus();

  if (!copied && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([buildSignature(current, { target: targetId, imageMode: "data" })], { type: "text/html" }),
          "text/plain": new Blob([buildPlainText(current)], { type: "text/plain" }),
        }),
      ]);
      copied = true;
    } catch (err) {
      copied = false;
    }
  }
  return copied;
}

/* ----------------------------- packaging -------------------------------- */

const CRLF = (text) => text.replace(/\r?\n/g, "\r\n");

function installReadme(person) {
  return CRLF(`humaniseAI email signature - ${person.name}
Outlook Desktop for Windows

1. Press Win + R, type   %APPDATA%\\Microsoft\\Signatures   and press Enter.
2. Copy these into that folder, keeping them side by side:

       humaniseAI.htm
       humaniseAI.txt
       ${FILES_DIR}\\      (the whole folder)

3. Fully close and reopen Outlook.
4. File > Options > Mail > Signatures.
5. Set "humaniseAI" as the default for New messages and Replies/forwards.
6. Click OK and open a new email to check it.

Keep ${FILES_DIR} next to humaniseAI.htm. Outlook loads the images from
that folder by relative path - move or rename it and the signature goes blank.

Do not paste this build into Outlook. The pasted route is on the
"Outlook Web / New Outlook" tab of the signature page, which embeds the
images instead of linking them.
`);
}

/**
 * The Windows package: the .htm Outlook reads, its plain-text twin, and the
 * images as loose files. buildDocument fills `collect` with exactly the images
 * the markup references, so the folder can never drift from the HTML.
 */
function buildPackage(person) {
  const collect = new Map();
  const html = buildDocument(person, { target: "outlook-win", collect });

  return zip([
    { name: "humaniseAI.htm", data: html },
    { name: "humaniseAI.txt", data: CRLF(buildPlainText(person)) },
    ...[...collect].map(([name, uri]) => ({
      name: `${FILES_DIR}/${name}`,
      data: bytesFromDataUri(uri),
    })),
    { name: "INSTALL.txt", data: installReadme(person) },
  ]);
}

function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------ actions --------------------------------- */

actionsEl.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-act]");
  if (!button || !current) return;
  const stem = current.name.replace(/\s+/g, "_");

  if (button.dataset.act === "copy") {
    const ok = await copySignature();
    if (ok) {
      button.classList.add("copied");
      button.lastChild.textContent = " Copied";
      toast("Signature copied - now paste it into your email settings");
      setTimeout(() => {
        button.classList.remove("copied");
        button.lastChild.textContent = " Copy signature";
      }, 2600);
    } else {
      toast("Copy was blocked by the browser - try again, or use a different browser");
    }
    return;
  }

  if (button.dataset.act === "photo") {
    // Falls back to the signature-size photo (or the drawn initials) when there
    // is no full-size original on file.
    const person = current;
    let uri = photoFor(person);
    if (person.photo) {
      try {
        uri = await loadFullPhoto(person.photo);
      } catch (err) {
        /* keep the signature-size one */
      }
    }
    save(new Blob([bytesFromDataUri(uri)], { type: "image/png" }), `${stem}_profile_photo.png`);
    return;
  }

  if (button.dataset.act === "zip") {
    save(buildPackage(current), `${stem}_humaniseAI_Signature_Outlook_Windows.zip`);
    toast("Package downloaded - unzip it, then follow the steps below");
    return;
  }

  if (button.dataset.act === "html") {
    const target = TARGETS[targetId];
    const ext = target.delivery === "zip" ? "htm" : "html";
    // A standalone .htm with folder-relative images would show nothing on its
    // own, so the loose download always embeds them.
    const html = buildDocument(current, { target: targetId, imageMode: "data" });
    save(new Blob([html], { type: "text/html" }), `${stem}_humaniseAI_Signature.${ext}`);
  }
});

let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

/* ------------------------------- routing -------------------------------- */

function route() {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const person = people.find((p) => p.id === id);

  if (person) {
    renderDetail(person);
    listView.hidden = true;
    detailView.hidden = false;
  } else {
    document.title = "humaniseAI Email Signatures";
    detailView.hidden = true;
    listView.hidden = false;
    if (id) location.replace("#/");
  }
  window.scrollTo(0, 0);
}

searchEl.addEventListener("input", () => renderList(searchEl.value));
window.addEventListener("hashchange", route);

renderList();
route();
})();
