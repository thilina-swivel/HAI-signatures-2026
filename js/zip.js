window.HAI = window.HAI || {};

(function () {
// ---------------------------------------------------------------------------
// A minimal ZIP writer - about 70 lines, no dependency.
//
// The Windows build ships as a folder of files, which means the page has to
// hand over an archive. Pulling JSZip off a CDN would break the one promise the
// README makes about this project: that index.html works straight off the file
// system with nothing installed. So we write the archive by hand.
//
// Everything is STORED (method 0, no compression). PNG and JPG are already
// compressed, so deflating them again would buy a few bytes for a lot of code.
// ---------------------------------------------------------------------------

let CRC_TABLE = null;

function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  CRC_TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c >>> 0;
  }
  return CRC_TABLE;
}

function crc32(bytes) {
  const table = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = (c >>> 8) ^ table[(c ^ bytes[i]) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS packed date/time, which is what the ZIP header format still wants. */
function dosStamp(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

const utf8 = (text) => new TextEncoder().encode(text);

/** Decode a "data:<mime>;base64,<payload>" URI into raw bytes. */
function bytesFromDataUri(uri) {
  const binary = atob(String(uri).slice(String(uri).indexOf(",") + 1));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * Build a ZIP from [{ name, data }], where data is a string or a Uint8Array.
 * Returns a Blob ready for a download link.
 */
function zip(entries) {
  const stamp = dosStamp();
  const parts = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const data = typeof entry.data === "string" ? utf8(entry.data) : entry.data;
    const name = utf8(entry.name);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30 + name.length));
    local.setUint32(0, 0x04034b50, true);   // local file header signature
    local.setUint16(4, 20, true);           // version needed to extract (2.0)
    local.setUint16(6, 0x0800, true);       // flags: filenames are UTF-8
    local.setUint16(8, 0, true);            // method: stored
    local.setUint16(10, stamp.time, true);
    local.setUint16(12, stamp.date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); // compressed size
    local.setUint32(22, data.length, true); // uncompressed size
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);           // extra field length
    const localBytes = new Uint8Array(local.buffer);
    localBytes.set(name, 30);

    const dir = new DataView(new ArrayBuffer(46 + name.length));
    dir.setUint32(0, 0x02014b50, true);     // central directory header signature
    dir.setUint16(4, 20, true);             // version made by
    dir.setUint16(6, 20, true);             // version needed
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, stamp.time, true);
    dir.setUint16(14, stamp.date, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, data.length, true);
    dir.setUint32(24, data.length, true);
    dir.setUint16(28, name.length, true);
    dir.setUint32(42, offset, true);        // offset of the local header above
    const dirBytes = new Uint8Array(dir.buffer);
    dirBytes.set(name, 46);

    parts.push(localBytes, data);
    central.push(dirBytes);
    offset += localBytes.length + data.length;
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);       // end of central directory
  end.setUint16(8, entries.length, true);   // entries on this disk
  end.setUint16(10, entries.length, true);  // entries in total
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
    type: "application/zip",
  });
}

HAI.zip = zip;
HAI.bytesFromDataUri = bytesFromDataUri;
})();
