# humaniseAI Email Signatures

An index page listing every employee. Pick a name, pick the email client you
use, then either copy the signature or download a ready-made package.

Open `index.html` in a browser — it works straight from the file system, no
server needed. To put it on an intranet or share it, upload the whole folder.

## The three builds

One layout, three builds. The differences are not cosmetic — they come from how
each client renders HTML, and they are all declared in `js/targets.js`:

| | Outlook Web / New Outlook | Outlook Desktop (Windows) | Outlook Desktop (Mac) |
|---|---|---|---|
| Renderer | Chromium / WebKit | **Word** | WebKit |
| Images | base64, travel with the paste | loose files in `humaniseAI_files/` | base64 |
| Width | fluid, `max-width:480px` | fixed `480px` | fixed `480px` |
| Extra markup | — | MSO conditional head block | — |
| How it is installed | copy &amp; paste | copy a folder to `%APPDATA%\Microsoft\Signatures` | copy &amp; paste |

Three things drive those choices:

- **The Word engine has no `max-width`.** A fluid table collapses to its content
  in classic Outlook, so the desktop builds are pinned to 480px and only the web
  build is allowed to shrink.
- **The web build caps the table but never the cover image.** The Outlook app on
  Android ignores `max-width` on a table — it stretches to the full viewport —
  while still honouring it on an `<img>`. With the cap in both places the text
  reflowed to the screen edge and the cover stopped at 480, visibly short of
  everything above it. A plain `width:100%` on the image ties it to whatever the
  table actually became, so the two can never disagree. iOS and the browsers cap
  the table at 480, so there the image resolves to the same 480 as before.
  Do not re-add `max-width` to that image.
- **Classic Outlook rescales images by the system DPI.** On a 125% display a
  140px photo arrives at 175px. The `<o:PixelsPerInch>96</o:PixelsPerInch>`
  block in the Windows build is what stops it, which is why that build is a
  downloaded file rather than a paste.
- **Windows Outlook reads signatures off disk.** Its build therefore links its
  images by relative path instead of embedding them, and ships as a ZIP with the
  `humaniseAI_files/` folder alongside. `buildSignature()` records every image it
  actually references, so the folder can never drift from the HTML.

Adding a fourth client is a data change in `js/targets.js`, not a code change.

## Adding or updating an employee

1. Drop their picture into `Profile photoes/` (see the sizes below).
2. Run the embedder so the new photo becomes a base64 data URI:

   ```
   python3 build/embed-assets.py
   ```

   It prints the `photo:` id to use for each picture it finds, and warns about
   any image that is too small or the wrong shape.

3. Add the person to `js/employees.js`:

   ```js
   {
     name: "Navindu M.",
     title: "Software Engineer",
     phone: "+94 71 234 5678",
     mobile: "+94 76 111 2222",        // optional — adds a second phone row
     email: "navindu@humaniseai.io",   // optional — omit to leave the row out
     photo: "navindu-m",               // id printed in step 2
     team: "Engineering",              // optional — groups the index page
   },
   ```

   Drop the `draft: true` flag once their details are filled in; that flag is
   what shows the amber "Details pending" badge on the card.

No photo yet? Leave `photo` out and their initials are drawn automatically, so
the layout still holds.

## Image sizes

Every image is **drawn at the 1× size and supplied at 2×**. The signature always
declares the 1× size in both the HTML attribute and the inline style — that is
what keeps it sharp on high-DPI screens *and* what stops classic Outlook
rescaling it. `build/embed-assets.py` warns when a file misses these.

| File | Drawn at | **Supply** | Notes |
|---|---|---|---|
| `Profile photoes/<name>.png` | 117 × 117 | **234 × 234** | Square. Round corners must be baked into the file — `border-radius` is ignored by Outlook Windows |
| `assets/banner.jpg` | 480 × 70 | **960 × 140** | Rasterised from `Cover-212x140.svg` — see below. Never an animated GIF: Outlook Windows shows frame 1 only |
| `assets/logo-web.png` | 67 × 19 | **134 × 38** | The `humaniseai.io` pill |
| `assets/icon-linkedin.png` etc. | 19 × 19 | **38 × 38** | One per network in `COMPANY.social` |
| `assets/icon-phone.png` | 12 × 12 | **24 × 24** | |
| `assets/icon-address.png` | 11 × 12 | **22 × 24** | The location pin |
| `assets/icon-email.png` | 11 × 12 | **22 × 24** | Optional. Until it exists, the email row borrows the location pin |

### The banner is rasterised, not vector

`assets/Cover-212x140.svg` is the artwork; `assets/banner.jpg` is what actually
ships. **Never put the SVG in the signature** — the Word engine in Outlook
Desktop has no SVG support at all, and Gmail strips it. Re-cut it with:

```
rsvg-convert -w 960 -h 140 -b white assets/Cover-212x140.svg -o /tmp/banner.png
sips -s format jpeg -s formatOptions 85 /tmp/banner.png --out assets/banner.jpg
python3 build/embed-assets.py
```

JPEG at quality 85 lands around 25 KB. The PNG is ~57 KB, which becomes ~76 KB
once base64 encoded — and that rides along on every email, so the JPEG wins.

If the cover is ever recut at a different height, change `BANNER_RATIO` in
`js/signature.js` to match and the three builds stay in agreement.

## Changing something for everybody

`js/company.js` holds the address, website, social links and the legal
disclaimer. Edit it once and every signature updates.

To change the layout itself, edit `js/signature.js`. It follows the "Furnish
your space" template structure — photo left, icon-and-text contact rows, a
social row led by the `humaniseai.io` pill, then a full-bleed banner — built the
way that template builds it: nested tables, inline styles only, no class
attributes, every image sized twice. `Signatures HTML/` and `Email Template/`
keep the two originals for reference.

The geometry is the block of constants at the top of `js/signature.js`, and it
the template's own: 480px wide, split 142 + 25 + 313, with a full-bleed
480 × 70 banner. The photo cell carries no padding — it is simply wider than the
photo, which is how the template left room for the rule that used to sit at its
edge. Recut the banner and `BANNER_RATIO` is the only line to change.

## Why the preview is an iframe

Don't replace the `<iframe>` in `index.html` with a plain `<div>`. When the
browser copies a selection it bakes the *surrounding page's* computed styles
into the clipboard, and Outlook then applies those over the signature's own
inline styles — the disclaimer loses its grey, links get underlined again, and
the text sizes go to the editor default. Keeping the signature in a bare iframe
with none of this page's CSS makes the clipboard byte-for-byte identical to
opening the standalone .html file and pressing Ctrl+A, Ctrl+C.

The preview always embeds its images, whichever build is selected: an iframe has
no folder next to it, so the Windows build's relative paths would show as broken
images. Everything else about that build — its width, its conditionals — is
still what you see.

## Why the images are base64

Each image is embedded in the HTML rather than linked. That way a pasted
signature carries its pictures with it, instead of breaking the day the folder
moves or a recipient blocks remote images. `assets/` holds the original PNG/JPG
files; `js/assets.js` and `js/photos.js` are generated from them and should not
be edited by hand.

The Windows build is the deliberate exception, for the DPI reason above.

## Why there is a hand-written ZIP

`js/zip.js` is about 70 lines and has no dependency. Pulling JSZip off a CDN
would break the one promise this project makes — that `index.html` works
straight off the file system with nothing installed. Everything is stored
uncompressed, since PNG and JPG are already compressed.

## Files

```
index.html              the page: employee list + client picker + signature
css/style.css           page styling (never touches the signature markup)
js/company.js           shared company details            ← edit
js/employees.js         the employee list                 ← edit
js/targets.js           the three clients and their steps ← edit
js/signature.js         builds the signature markup
js/zip.js               minimal ZIP writer for the Windows package
js/app.js               list, search, routing, copy, packaging
js/assets.js            brand images, base64              ← generated
js/photos.js            employee photos, base64           ← generated
assets/                 source images (incl. logo-humaniseai.svg for the top bar)
build/embed-assets.py   regenerates the two files above, checks image sizes
Email Template/         the original "Furnish your space" template, for reference
Signatures HTML/        the approved v4 signature, for reference
```
