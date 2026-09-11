window.HAI = window.HAI || {};

(function () {
const { ASSETS, PHOTOS, COMPANY } = HAI;

// Builds the humaniseAI email signature markup for one person.
// The output mirrors the approved v4 layout: nested tables, inline styles only,
// and base64 images - the combination Outlook, Gmail and Apple Mail all tolerate.


const FONT = "'Aptos','Segoe UI',Arial,Helvetica,sans-serif";
const RESET = "-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;mso-line-height-rule:exactly;";

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
  const size = 240;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e8eaed";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#6b7280";
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

// One icon + text row (phone, address, email).
function detailRow({ icon, alt, width, height, text, href, last }) {
  const pad = last ? "0" : "0 0 5px 0";
  const linkStyle = `color:#000000;text-decoration:none;${RESET}font-family:${FONT};font-weight:500;font-size:12px;line-height:16px;`;
  const body = href
    ? `<a href="${href}" target="_blank" style="${linkStyle}">${text}</a>`
    : text;
  return `
                    <tr>
                      <td width="12" valign="top" style="width:12px;padding:${pad};vertical-align:top;font-size:0;line-height:0;">
                        <img src="${icon}" width="${width}" height="${height}" alt="${esc(alt)}" style="display:block;width:${width}px;height:${height}px;border:0;outline:none;margin-top:3px;">
                      </td>
                      <td valign="top" style="vertical-align:top;padding:${pad};padding-left:5px;${RESET}font-family:${FONT};font-weight:500;font-size:12px;line-height:18px;color:#000000;">
                        ${body}
                      </td>
                    </tr>`;
}

function socialCells() {
  const cells = [
    {
      url: COMPANY.website,
      img: ASSETS.website,
      alt: "humaniseai.io",
      w: 67,
      h: 19,
    },
    ...COMPANY.social.map((s) => ({ url: s.url, img: ASSETS[s.key], alt: s.label, w: 19, h: 19 })),
  ].filter((cell) => cell.img);

  return cells
    .map((cell, i) => {
      const pad = i === cells.length - 1 ? "0" : "0 11px 0 0";
      return `
                      <td valign="middle" style="vertical-align:middle;padding:${pad};font-size:0;line-height:0;">
                        <a href="${esc(cell.url)}" target="_blank" style="text-decoration:none;border:0;"><img src="${cell.img}" width="${cell.w}" height="${cell.h}" alt="${esc(cell.alt)}" style="display:block;width:${cell.w}px;height:${cell.h}px;border:0;outline:none;"></a>
                      </td>`;
    })
    .join("");
}

/** The signature itself: one <table> ready to drop into an email client. */
function buildSignature(employee) {
  const rows = [];
  if (employee.phone) {
    rows.push({
      icon: ASSETS.phone,
      alt: "Phone",
      width: 12,
      height: 12,
      text: nbsp(employee.phone),
      href: telHref(employee.phone),
    });
  }
  if (employee.email) {
    rows.push({
      icon: ASSETS.address,
      alt: "Email",
      width: 11,
      height: 12,
      text: esc(employee.email),
      href: "mailto:" + employee.email,
    });
  }
  if (COMPANY.address) {
    rows.push({
      icon: ASSETS.address,
      alt: "Address",
      width: 11,
      height: 12,
      text: esc(COMPANY.address),
      href: COMPANY.mapUrl,
    });
  }
  const details = rows
    .map((row, i) => detailRow({ ...row, last: i === rows.length - 1 }))
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse;${RESET}font-family:${FONT};">

  <tr>
    <td style="padding:14px 0 14px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
        <tr>

          <td width="138" valign="top" style="width:138px;padding:0 18px 0 0;vertical-align:top;font-size:0;line-height:0;">
            <img src="${photoFor(employee)}" width="120" height="120" alt="${esc(employee.name)}" style="display:block;width:120px;height:120px;border:0;outline:none;text-decoration:none;">
          </td>

          <td valign="top" style="vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">

              <tr>
                <td style="padding:0 0 4px 0;${RESET}font-family:${FONT};font-weight:500;font-size:15px;line-height:19px;color:#000000;">
                  ${esc(employee.name)}
                </td>
              </tr>

              <tr>
                <td style="padding:0 0 10px 0;${RESET}font-family:${FONT};font-weight:600;font-size:11px;letter-spacing:2.25px;line-height:16px;color:#000000;">
                  ${esc(String(employee.title || "").toUpperCase())}
                </td>
              </tr>

              <tr>
                <td style="padding:0 0 11px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${details}
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr>${socialCells()}
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:0;font-size:0;line-height:0;">
      <img src="${ASSETS.banner}" width="600" height="82" alt="${esc(COMPANY.bannerAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;">
    </td>
  </tr>

  <tr>
    <td style="padding:12px 0 14px 0;${RESET}font-family:${FONT};font-size:11px;line-height:15px;color:#8c8c8c;">
      ${esc(COMPANY.disclaimer)}
    </td>
  </tr>

</table>`;
}

/** Plain-text fallback, used for the text/plain half of the clipboard. */
function buildPlainText(employee) {
  return [
    employee.name,
    String(employee.title || "").toUpperCase(),
    employee.phone,
    employee.email,
    COMPANY.address,
    COMPANY.website.replace(/\/$/, ""),
  ]
    .filter(Boolean)
    .join("\n");
}

/** A complete, standalone .html file - what the download button hands over. */
function buildDocument(employee) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(employee.name)} - ${esc(COMPANY.name)} Email Signature</title>
</head>
<body style="margin:0;padding:20px;background:#f2f2f2;">

${buildSignature(employee)}

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
})();
