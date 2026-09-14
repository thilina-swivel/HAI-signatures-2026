window.HAI = window.HAI || {};

(function () {
const { ASSETS, PHOTOS, COMPANY, TARGETS, DEFAULT_TARGET } = HAI;

// ---------------------------------------------------------------------------
// Builds the humaniseAI email signature for one person, for one client.
//
// The layout follows the "Furnish your space" template: a photo on the left
// behind a coloured rule, pipe-separated contact lines on the right, a social
// row, then a full-bleed banner. Same technique as the original - one table,
// inline styles only, no class attributes, images sized in both the HTML
// attribute and the inline style.
//
// What changes per client is described in js/targets.js. Everything here reads
// those flags rather than branching on client names, so adding a fourth target
// is a data change, not a code change.
// ---------------------------------------------------------------------------

const FONT = "'Aptos','Segoe UI',Arial,Helvetica,sans-serif";
const RESET = "-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;mso-line-height-rule:exactly;";

const ACCENT = "#5D36FF";   // humaniseAI violet, used for the initials fallback
const INK = "#000000";
const GREY = "#8c8c8c";

// The template's own geometry, kept exactly: 480px total, split 142 + 25 + 313.
// The photo cell carries no padding - it is simply wider than the photo, which
// is how the template leaves room for the rule that used to sit at its edge.
// Nothing here is content-box sensitive as a result.
const WIDTH = 480;
const PHOTO = 117;
const PHOTO_CELL = 142;
const GUTTER = 25;
const CONTENT = WIDTH - PHOTO_CELL - GUTTER;   // 313

// The banner is full-bleed, so it is the table width at the cover's proportions.
// Recut the artwork and this is the only line to change.
const BANNER_RATIO = [480, 70];
const BANNER_H = Math.round((WIDTH * BANNER_RATIO[1]) / BANNER_RATIO[0]);

const SOCIAL = 19;        // round social icons
const PILL_W = 67;        // the humaniseai.io pill
const PILL_H = 19;

// Render phone numbers as tel: links. Off: the Outlook mobile apps force their
// own blue underline on tel: anchors, which is louder than tap-to-call is useful.
const TAP_TO_CALL = false;

const FILES_DIR = "humaniseAI_files";

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(name = "") {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Phone numbers should never wrap mid-number, so the spaces become non-breaking.
const nbsp = (value) => esc(value).replace(/ /g, "&#160;");
const telHref = (value) => "tel:" + String(value).replace(/[^\d+]/g, "");

// U+2060 WORD JOINER: zero-width, and unlike a zero-width space it creates no
// line-break opportunity, so a number can never wrap mid-digit.
const WJ = "&#8288;";

/**
 * A phone number the OS will not turn into a link.
 *
 * iOS and Android detect phone numbers in the rendered *text* and wrap them in
 * an anchor of their own, which is why neither styling our anchor nor removing
 * it helped - the client was building a link either way.
 *
 * Two strengths, because the two platforms differ:
 *
 *   base       a U+2060 WORD JOINER between the groups. Zero-width, no
 *              line-break opportunity. Enough for iOS.
 *   aggressive iOS is satisfied by that; Android is not - it normalises
 *              zero-width characters away before matching. It cannot normalise
 *              away a real letter, so one is inserted between the groups and
 *              rendered at font-size:0. The text a detector reads becomes
 *              "+94 x76 x843 x4334", which is not a phone number by anyone's
 *              pattern, while the glyph itself occupies no space.
 *
 * The aggressive form is used only where it is needed - see hidePhone in
 * js/targets.js - so the desktop builds keep clean markup and never risk the
 * Word engine mishandling a zero-size font.
 */
function phoneText(value, aggressive) {
  const safe = esc(value);
  const groups = safe.split(" ");
  if (groups.length < 2) {
    // No spaces to hide behind - split the digits down the middle instead.
    const mid = Math.floor(safe.length / 2);
    return safe.slice(0, mid) + WJ + safe.slice(mid);
  }
  const blocker = aggressive
    ? `<span aria-hidden="true" style="font-size:0;line-height:0;">x</span>`
    : "";
  return groups.join(`${WJ}&#160;${blocker}${WJ}`);
}

// The file an image becomes inside the Windows package. The extension comes
// from the data URI itself, so swapping banner.jpg for a PNG stays correct.
function fileNameFor(key, uri) {
  const ext = /^data:image\/jpe?g/i.test(uri) ? "jpg"
    : /^data:image\/gif/i.test(uri) ? "gif"
    : "png";
  return `${key}.${ext}`;
}

// No photo on file yet: draw the person's initials so the layout still holds.
const AVATAR_CACHE = new Map();

function initialsAvatar(name) {
  if (AVATAR_CACHE.has(name)) return AVATAR_CACHE.get(name);
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  const size = PHOTO * 2;                 // 2x, same rule as every other asset
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#efeaff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = ACCENT;
  ctx.font = `500 ${size * 0.36}px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials || "?", size / 2, size / 2 + size * 0.02);
  const uri = canvas.toDataURL("image/png");
  AVATAR_CACHE.set(name, uri);
  return uri;
}

function photoFor(employee) {
  return PHOTOS[employee.photo] || initialsAvatar(employee.name);
}

/**
 * One signature, built for one target.
 *
 * opts.target     id from js/targets.js
 * opts.imageMode  override "data" | "files" (the preview forces "data", since
 *                 an iframe cannot resolve humaniseAI_files/)
 * opts.collect    optional Map, filled with filename -> data URI for every
 *                 image actually referenced. The packager uses it so the ZIP
 *                 holds exactly what the markup asks for, never more or less.
 */
function buildSignature(employee, opts = {}) {
  const target = TARGETS[opts.target] || TARGETS[DEFAULT_TARGET];
  const mode = opts.imageMode || target.imageMode;
  const collect = opts.collect;

  // Resolve an image to a src, recording it on the way through.
  const img = (key, uri) => {
    const name = fileNameFor(key, uri);
    if (collect) collect.set(name, uri);
    return mode === "files" ? `${FILES_DIR}/${name}` : uri;
  };

  const text = `${RESET}font-family:${FONT};font-weight:500;font-size:12px;line-height:16px;color:${INK};`;

  // Contact links stay black and unadorned. Styling the <a> alone is not enough:
  // the Outlook mobile apps restyle tel: and mailto: to their own blue underline,
  // and the Word engine underlines anchors whatever the anchor says. Declaring
  // the colour twice - on the <a>, then again on a <span> inside it - is what
  // holds, because the clients that override the anchor leave the inner span
  // alone. It is the template's own technique, and the reason it nests a span in
  // every link it draws.
  const noLink = `color:${INK} !important;text-decoration:none !important;`;
  const linkA = `${text}line-height:18px;${noLink}`;
  const linkSpan = `${RESET}font-family:${FONT};font-weight:500;font-size:12px;line-height:18px;${noLink}`;
  const link = (body, href) =>
    `<a href="${href}" target="_blank" style="${linkA}"><span style="${linkSpan}">${body}</span></a>`;

  /* ---- contact rows: one icon + one line, the way the v4 signature had it ---- */

  const row = ({ icon, uri, alt, w, h, body, href, last }) => `
                    <tr>
                      <td width="12" valign="top" style="width:12px;padding:${last ? "0" : "0 0 5px 0"};vertical-align:top;font-size:0;line-height:0;">
                        <img src="${img(icon, uri)}" width="${w}" height="${h}" alt="${esc(alt)}" style="display:block;width:${w}px;height:${h}px;border:0;outline:none;margin-top:3px;">
                      </td>
                      <td valign="top" style="vertical-align:top;padding:${last ? "0" : "0 0 5px 0"};padding-left:7px;${text}line-height:18px;">
                        ${href ? link(body, href) : body}
                      </td>
                    </tr>`;

  // No envelope in assets/ yet, so email borrows the address icon - drop an
  // icon-email.png in and it is picked up here without a code change.
  const mailIcon = ASSETS.email ? ["email", ASSETS.email] : ["address", ASSETS.address];

  // Phone numbers are plain text, not tel: links.
  //
  // The nested-span trick holds for every other link - the address is an <a> to
  // Google Maps and it renders black - but the Outlook mobile apps special-case
  // phone numbers, restyling them to their own blue underline whatever the
  // markup says. The only thing that reliably wins is not handing them an
  // anchor to restyle. Set TAP_TO_CALL back to true to trade the appearance for
  // a tappable number.
  const rows = [];
  if (employee.phone) {
    rows.push({ icon: "phone", uri: ASSETS.phone, alt: "Phone", w: 12, h: 12,
                body: phoneText(employee.phone, target.hidePhone),
                href: TAP_TO_CALL ? telHref(employee.phone) : null });
  }
  if (employee.mobile) {
    rows.push({ icon: "phone", uri: ASSETS.phone, alt: "Mobile", w: 12, h: 12,
                body: phoneText(employee.mobile, target.hidePhone),
                href: TAP_TO_CALL ? telHref(employee.mobile) : null });
  }
  if (employee.email) {
    rows.push({ icon: mailIcon[0], uri: mailIcon[1], alt: "Email", w: 11, h: 12,
                body: esc(employee.email), href: "mailto:" + esc(employee.email) });
  }
  if (COMPANY.address) {
    rows.push({ icon: "address", uri: ASSETS.address, alt: "Address", w: 11, h: 12,
                body: esc(COMPANY.address), href: COMPANY.mapUrl });
  }

  const contact = rows.map((r, i) => row({ ...r, last: i === rows.length - 1 })).join("");

  /* ---- social row ---- */

  const cells = [
    { url: COMPANY.website, key: "website", uri: ASSETS.website, alt: "humaniseai.io", w: PILL_W, h: PILL_H },
    ...COMPANY.social.map((s) => ({ url: s.url, key: s.key, uri: ASSETS[s.key], alt: s.label, w: SOCIAL, h: SOCIAL })),
  ].filter((cell) => cell.uri);

  const socials = cells
    .map((cell, i) => `
                    <td valign="middle" style="vertical-align:middle;padding:${i === cells.length - 1 ? "0" : "0 11px 0 0"};font-size:0;line-height:0;">
                      <a href="${esc(cell.url)}" target="_blank" style="text-decoration:none;border:0;"><img src="${img(cell.key, cell.uri)}" width="${cell.w}" height="${cell.h}" alt="${esc(cell.alt)}" style="display:block;width:${cell.w}px;height:${cell.h}px;border:0;outline:none;"></a>
                    </td>`)
    .join("");

  const socialRow = socials
    ? `
              <tr>
                <td style="padding:12px 0 0 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr>${socials}
                    </tr>
                  </table>
                </td>
              </tr>`
    : "";

  /* ---- target-conditional sizing ----
     Outlook Desktop (Windows) draws mail with the Word engine, which has no
     max-width at all: a fluid table there collapses to its content. So the
     desktop builds are pinned and only the web build is allowed to shrink.

     The web build carries max-width on the TABLE but deliberately not on the
     banner. The Outlook app on Android ignores max-width on a table - it
     stretches to the full viewport - while still honouring it on an <img>. Put
     it in both places and the text reflows out to the screen edge while the
     cover stops at 480, short of everything above it. Leaving the image at a
     plain width:100% ties it to whatever the table actually became, so the two
     can never disagree. iOS and the browsers honour the table cap, so there the
     table stays 480 and the image resolves to the same 480 it always did. */

  const tableWidth = target.fluid ? `width:100%;max-width:${WIDTH}px;` : `width:${WIDTH}px;`;
  const bannerStyle = target.fluid
    ? `display:block;width:100%;height:auto;border:0;outline:none;`
    : `display:block;width:${WIDTH}px;height:${BANNER_H}px;border:0;outline:none;`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${WIDTH}" style="${tableWidth}background:#ffffff;border-collapse:collapse;${RESET}font-family:${FONT};">

  <tr>
    <td style="padding:14px 0 14px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <tr>

          <td width="${PHOTO_CELL}" valign="top" style="width:${PHOTO_CELL}px;padding:0;vertical-align:top;font-size:0;line-height:0;">
            <img src="${img("photo", photoFor(employee))}" width="${PHOTO}" height="${PHOTO}" alt="${esc(employee.name)}" style="display:block;width:${PHOTO}px;height:${PHOTO}px;border:0;outline:none;text-decoration:none;">
          </td>

          <td width="${GUTTER}" style="width:${GUTTER}px;font-size:0;line-height:0;">&#160;</td>

          <td width="${CONTENT}" valign="top" style="width:${CONTENT}px;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">

              <tr>
                <td style="padding:0 0 3px 0;${RESET}font-family:${FONT};font-weight:700;font-size:16px;line-height:20px;color:${INK};">
                  ${esc(employee.name)}
                </td>
              </tr>

              <tr>
                <td style="padding:0 0 10px 0;${RESET}font-family:${FONT};font-weight:400;font-size:12px;line-height:16px;color:${INK};">
                  ${esc(employee.title || "")}
                </td>
              </tr>

              <tr>
                <td style="padding:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${contact}
                  </table>
                </td>
              </tr>
${socialRow}
            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:0;font-size:0;line-height:0;">
      <img src="${img("banner", ASSETS.banner)}" width="${WIDTH}" height="${BANNER_H}" alt="${esc(COMPANY.bannerAlt)}" style="${bannerStyle}">
    </td>
  </tr>

  <tr>
    <td style="padding:12px 0 14px 0;${RESET}font-family:${FONT};font-size:11px;line-height:15px;color:${GREY};">
      ${esc(COMPANY.disclaimer)}
    </td>
  </tr>

</table>`;
}

/** Plain-text fallback: the text/plain half of the clipboard, and humaniseAI.txt. */
function buildPlainText(employee) {
  return [
    employee.name,
    employee.title,
    [employee.phone && `P: ${employee.phone}`, employee.mobile && `M: ${employee.mobile}`]
      .filter(Boolean).join("  |  "),
    employee.email && `E: ${employee.email}`,
    COMPANY.website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    COMPANY.address,
  ]
    .filter(Boolean)
    .join("\n");
}

/** A complete, standalone document - the download, and humaniseAI.htm. */
function buildDocument(employee, opts = {}) {
  const target = TARGETS[opts.target] || TARGETS[DEFAULT_TARGET];

  // Classic Outlook rescales images by the system DPI unless this block tells
  // it the artwork is already at 96 DPI. Without it a 140px photo balloons to
  // 175px on a 125% display - the single most common "why is it huge" report.
  const mso = target.mso
    ? `<!--[if gte mso 9]><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml><![endif]-->
<!--[if mso]>
<style type="text/css">
  table, td, span, a, p, strong { font-family: 'Aptos', 'Segoe UI', Arial, sans-serif !important; }
</style>
<![endif]-->
`
    : "";

  const ns = target.mso ? ` xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"` : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"${ns} lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(employee.name)} - ${esc(COMPANY.name)} Email Signature</title>
${mso}</head>
<body style="margin:0;padding:${target.delivery === "zip" ? "0" : "20px"};background:#ffffff;">

${buildSignature(employee, opts)}

</body>
</html>
`;
}

HAI.esc = esc;
HAI.slug = slug;
HAI.initialsAvatar = initialsAvatar;
HAI.photoFor = photoFor;
HAI.buildSignature = buildSignature;
HAI.buildPlainText = buildPlainText;
HAI.buildDocument = buildDocument;
HAI.FILES_DIR = FILES_DIR;
})();
