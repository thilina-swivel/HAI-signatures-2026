# humaniseAI Email Signatures

An index page listing every employee. Pick a name, pick the email client you
use, then either copy the signature or download a ready-made package.

Open `index.html` in a browser — it works straight from the file system, no
server needed. To put it on an intranet or share it, upload the whole folder.

## The three builds

One layout, three builds. The differences are not cosmetic — they come from how
each client renders HTML, and they are all declared in `js/targets.js`:

| | Outlook on the web | Outlook for Windows (app) | Outlook for Mac (app) |
|---|---|---|---|
| Renderer | Chromium / WebKit | Chromium | WebKit |
| Images | base64, travel with the paste | base64 | base64 |
| Width | fluid, `max-width:480px` | fluid, `max-width:480px` | fixed `480px` |
| How it is installed | copy &amp; paste | copy &amp; paste | copy &amp; paste |

The new Outlook for Windows is the web client in an app window — same engine,
same signature store — so its markup is the web build exactly. It is a separate
tab only because the route to the settings screen differs.

**Classic Outlook is built but not offered.** `outlook-win` is still defined in
`js/targets.js`, with its Word-engine markup, its MSO DPI block and its ZIP
package — almost nobody here is still on it, and that route is by far the most
fiddly, so it is left off `TARGET_ORDER`. Put the id back in that array to bring
the tab back; nothing else needs changing.

Three things drive those choices:

- **The Word engine has no `max-width`.** A fluid table collapses to its content
  in classic Outlook, which is why that build — still there, just not offered —
  is pinned to 480px.
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
the template's own: 480px wide, split 117 + 30 + 333, with a full-bleed
480 × 70 banner. The template made the photo cell wider than the photo to leave
room for a coloured rule between the two; with that rule gone the slack was dead
space, so the cell is now exactly the photo and the gap is one number, `GUTTER`. Recut the banner and `BANNER_RATIO` is the only line to change.

## Two things the Outlook Windows app got wrong

Both were found in the new Outlook for Windows and both are fixed in the shared
builder, so every build gets them:

- **The icons rode high against the text.** The 3px nudge that centres a 12px
  icon on an 18px line was a `margin-top` on the `<img>`, and the Word engine
  ignores margins on images. It is `padding` on the cell now, which Outlook does
  honour.
- **Links came through underlined** despite `text-decoration:none !important` on
  both the `<a>` and the span inside it. That is CSS, not a client quirk:
  decoration set on an ancestor is *drawn through* its descendants and cannot be
  cancelled further down. It does not propagate into an `inline-block`, so the
  inner span is one. Do not remove that `display:inline-block`.

## Why every link has a span inside it

The contact lines are links — tap-to-call, mailto, the map — but they must read
as plain black text, not as blue underlined links. Styling the `<a>` alone does
not survive: the Outlook mobile apps restyle `tel:` and `mailto:` to their own
blue underline, and the Word engine underlines anchors whatever the anchor says.

So the colour is declared twice, on the `<a>` and again on a `<span>` inside it,
both with `!important`. The clients that override the anchor leave the inner
span alone. It is the original template's own technique, and the reason it nests
a span in every link it draws.

Verified against a stylesheet forcing `color:blue !important` and
`text-decoration:underline !important` on every `<a>` — harsher than any real
client — and every link still computes to black with no underline in all three
builds. Don't remove either declaration.

**Phone numbers are the exception, and they took three attempts.** Styling the
anchor did not work. Removing the anchor did not work either. The cause is not
CSS at all: iOS and Android detect phone numbers in the rendered *text* and wrap
them in an anchor of their own, so the client was building a link whatever we
did. (The giveaway was the address — also an `<a>`, sitting one line below,
rendering black the whole time.)

The fix is to stop the number looking like a phone number to a detector, and it
takes two strengths because the platforms differ:

| | What goes between the groups | Detector reads |
|---|---|---|
| Base — enough for **iOS** | a U+2060 WORD JOINER | `+94 76 843 4334` with invisible joiners |
| Aggressive — needed for **Android** | the same, plus a letter at `font-size:0` | `+94 x76 x843 x4334` |

Android normalises zero-width characters away before matching, so the joiner
alone did nothing there. It cannot normalise away a real letter. Rendered at
`font-size:0` the letter occupies no space: the number measures 90.42px on the
desktop builds and 90.45px on the web build — a 0.03px difference.

WORD JOINER rather than a zero-width space on purpose: ZWSP creates a
line-break opportunity, which could wrap a number mid-digit.

The aggressive form is applied only to the web build (`hidePhone` in
`js/targets.js`). That is the only build that reaches a phone — a signature set
in new Outlook syncs to the mobile apps, while the desktop builds stay on the
machine they are installed on — so the desktop markup stays clean and never
risks the Word engine mishandling a zero-size font.

The plain-text half of the clipboard is built from the raw field and stays free
of all of it.

That is also the correction to an earlier theory. The blue was never the client
restyling our anchor — it was the detector building its own link over the top.
Removing the anchor did not help, which is what proved it; breaking the text did.

### Why the phone number is not a link

**Outlook's signature editor keeps only `http(s)` hrefs.** `tel:` and `mailto:`
are stripped on paste, before the client ever renders them. Confirmed by
elimination: the same signature opened in a browser has every link working, but
installed as an Outlook signature only the `https` ones respond — the address,
the website pill and the social icons — on Android, iOS and desktop alike.

No amount of markup fixes that: the href is gone before rendering. Which leaves
the OS detector as the only thing that can make the number tappable — and the
link it builds carries the client's own blue, out of our reach. It injects its
own anchor inside ours, and the CSS that would tame it
(`a[x-apple-data-detectors]`) lives in a `<style>` block the same editor strips.

So `PHONE_DETECTION` at the top of `js/signature.js` is the choice, and it is a
real one:

| | `"allow"` *(current)* | `"block"` |
|---|---|---|
| Number is | tappable | not tappable |
| Colour in Outlook | the client's blue | black |
| How | left intact, the OS links it | broken up so nothing matches |

Black **and** tappable needs an `https` href, since that is the one scheme that
survives the sanitiser — a redirect route on the website pointing at `tel:`.
Until that exists, it is one or the other.

The email keeps its `mailto:` anchor. Outlook strips it too, so it reads as plain
black text there — the same outcome — but it costs nothing and still works in
the downloaded `.html` and in clients that do preserve it.

| Scheme | In a browser | In an Outlook signature |
|---|---|---|
| `https:` — address, website, socials | works | **works** |
| `mailto:` — email | works | stripped |
| `tel:` — phone | works | stripped |

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
