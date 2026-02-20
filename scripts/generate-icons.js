#!/usr/bin/env node
/**
 * Generates build/icon.png and build/icon.ico using only Node.js built-ins.
 * No external dependencies required.
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ── CRC-32 helper ──────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG chunk builder ───────────────────────────────────────────────────────
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// ── Create a solid-colour PNG (RGB, 8-bit) ──────────────────────────────────
function createPNG(width, height, r, g, b) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // colour type: RGB
  // compression, filter, interlace → all 0

  // Raw scanlines: filter byte (0x00) + RGB pixels
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize, 0);
  for (let y = 0; y < height; y++) {
    const base = y * rowSize;
    // filter byte already 0
    for (let x = 0; x < width; x++) {
      raw[base + 1 + x * 3] = r;
      raw[base + 1 + x * 3 + 1] = g;
      raw[base + 1 + x * 3 + 2] = b;
    }
  }

  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Create an ICO that embeds a PNG image ───────────────────────────────────
// ICO with a single PNG entry (Windows Vista+ supports PNG-in-ICO)
function createICO(pngData, width, height) {
  // ICONDIR header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(1, 4); // count: 1 image

  // ICONDIRENTRY (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);   // width  (0 means 256)
  entry.writeUInt8(height >= 256 ? 0 : height, 1);  // height (0 means 256)
  entry.writeUInt8(0, 2);  // color count
  entry.writeUInt8(0, 3);  // reserved
  entry.writeUInt16LE(1, 4);  // planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngData.length, 8);  // size of image data
  entry.writeUInt32LE(6 + 16, 12);         // offset = header + one entry

  return Buffer.concat([header, entry, pngData]);
}

// ── Main ────────────────────────────────────────────────────────────────────
const buildDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(buildDir, { recursive: true });

// LumaLayout brand colour: deep navy #1a1a2e
const png256 = createPNG(256, 256, 0x1a, 0x1a, 0x2e);
const icoData = createICO(png256, 256, 256);

fs.writeFileSync(path.join(buildDir, 'icon.png'), png256);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoData);

console.log('Created build/icon.png (' + png256.length + ' bytes)');
console.log('Created build/icon.ico (' + icoData.length + ' bytes)');
