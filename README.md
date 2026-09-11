# humaniseAI Email Signatures

An index page listing every employee. Pick a name, see the signature, press
**Copy signature**, and follow the steps for Outlook, Gmail or Apple Mail.

Open `index.html` in a browser — it works straight from the file system, no
server needed. To put it on an intranet or share it, upload the whole folder.

## Adding or updating an employee

1. Drop their picture into `Profile photoes/` (square, 240×240 or larger).
2. Run the embedder so the new photo becomes a base64 data URI:

   ```
   python3 build/embed-assets.py
   ```

   It prints the `photo:` id to use for each picture it finds.

3. Add the person to `js/employees.js`:

   ```js
   {
     name: "Navindu M.",
     title: "Software Engineer",
     phone: "+94 71 234 5678",
     email: "navindu@humaniseai.io",   // optional — omit to leave the row out
     photo: "navindu-m",               // id printed in step 2
     team: "Engineering",              // optional — groups the index page
   },
   ```

   Drop the `draft: true` flag once their details are filled in; that flag is
   what shows the amber “Details pending” badge on the card.

No photo yet? Leave `photo` out and their initials are drawn automatically, so
the layout still holds.

## Changing something for everybody

`js/company.js` holds the address, website, social links and the legal
disclaimer. Edit it once and every signature updates.

To change the layout itself, edit `js/signature.js`. It follows the approved v4
markup — nested tables with inline styles only, which is what Outlook needs.
`Signatures HTML/Fahima_Fawnoon_-_HAI_Email_Signature_v4.html` is kept as the
reference original.

One deliberate change from v4: the photo row and the disclaimer row have no side
padding, so their left edge lines up with the full-bleed banner. To go back to
the v4 inset, set those two `<td>` paddings in `buildSignature()` to
`14px 20px 14px 20px` and `12px 20px 14px 20px`.

## Why the preview is an iframe

Don't replace the `<iframe>` in `index.html` with a plain `<div>`. When the
browser copies a selection it bakes the *surrounding page's* computed styles
into the clipboard, and Outlook then applies those over the signature's own
inline styles — the disclaimer loses its grey, links get underlined again, and
the text sizes go to the editor default. Keeping the signature in a bare iframe
with none of this page's CSS makes the clipboard byte-for-byte identical to
opening the standalone .html file and pressing Ctrl+A, Ctrl+C.

## Why the images are base64

Each image is embedded in the HTML rather than linked. That way a pasted
signature carries its pictures with it, instead of breaking the day the folder
moves or a recipient blocks remote images. `assets/` holds the original PNG/JPG
files; `js/assets.js` and `js/photos.js` are generated from them and should not
be edited by hand.

## Files

```
index.html              the page: employee list + signature + instructions
css/style.css           page styling (never touches the signature markup)
js/company.js           shared company details            ← edit
js/employees.js         the employee list                 ← edit
js/signature.js         builds the signature markup
js/app.js               list, search, routing, copy button
js/assets.js            brand images, base64              ← generated
js/photos.js            employee photos, base64           ← generated
assets/                 source images (incl. logo-humaniseai.svg for the top bar)
build/embed-assets.py   regenerates the two files above
```
