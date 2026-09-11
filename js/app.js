(function () {
// List of employees -> per-person signature page, with a copy button that keeps
// the images and formatting intact when pasted into an email client.


const { EMPLOYEES, buildSignature, buildPlainText, buildDocument, photoFor, esc, slug } = window.HAI;

const $ = (id) => document.getElementById(id);
const listView = $("view-list");
const detailView = $("view-detail");
const peopleEl = $("people");
const searchEl = $("search");
const noResults = $("no-results");
const frameEl = $("sig-frame");
const copyBtn = $("copy-btn");
const downloadBtn = $("download-btn");
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
  paintSignature(person);
  resetCopyButton();
}

/**
 * Write the signature into the iframe as a standalone document - the same thing
 * you get by opening the .html file on its own. Nothing from this page's
 * stylesheet reaches it, so a copy carries the signature's inline styles only.
 */
function paintSignature(person) {
  const doc = frameEl.contentDocument;
  doc.open();
  doc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="x-apple-disable-message-reformatting"></head>' +
      '<body style="margin:0;padding:0;background:#ffffff;">' +
      buildSignature(person) +
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

function resetCopyButton() {
  copyBtn.classList.remove("copied");
  copyBtn.lastChild.textContent = " Copy signature";
}

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
          "text/html": new Blob([buildSignature(current)], { type: "text/html" }),
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

copyBtn.addEventListener("click", async () => {
  const ok = await copySignature();
  if (ok) {
    copyBtn.classList.add("copied");
    copyBtn.lastChild.textContent = " Copied";
    toast("Signature copied - now paste it into your email settings");
    setTimeout(resetCopyButton, 2600);
  } else {
    toast("Copy was blocked by the browser - use Download .html instead");
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([buildDocument(current)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${current.name.replace(/\s+/g, "_")}_humaniseAI_Email_Signature.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
