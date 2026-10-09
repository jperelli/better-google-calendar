// Generates icons/icon{16,32,48,128}.png without any dependency: draws the
// glyph at 512px and box-downsamples it, which gives free anti-aliasing.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const S = 512;
const px = Buffer.alloc(S * S * 4);

function fill(x, y, [r, g, b, a]) {
  const i = (y * S + x) * 4;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
  px[i + 3] = a;
}

function roundedRect(x0, y0, w, h, radius, color) {
  for (let y = Math.floor(y0); y < y0 + h; y++) {
    for (let x = Math.floor(x0); x < x0 + w; x++) {
      const cx = Math.max(x0 + radius, Math.min(x + 0.5, x0 + w - radius));
      const cy = Math.max(y0 + radius, Math.min(y + 0.5, y0 + h - radius));
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= radius * radius) fill(x, y, color);
    }
  }
}

const BLUE = [26, 115, 232, 255];
const DARK_BLUE = [24, 90, 188, 255];
const WHITE = [255, 255, 255, 255];
const RED = [217, 48, 37, 255];

roundedRect(0, 0, S, S, 112, BLUE);
roundedRect(72, 104, 368, 336, 40, WHITE); // page
roundedRect(72, 104, 368, 88, 40, DARK_BLUE); // header band
roundedRect(72, 152, 368, 40, 0, DARK_BLUE); // square off header bottom
roundedRect(140, 56, 40, 96, 20, DARK_BLUE); // binder rings
roundedRect(332, 56, 40, 96, 20, DARK_BLUE);
roundedRect(236, 232, 40, 160, 12, RED); // plus sign
roundedRect(176, 292, 160, 40, 12, RED);

function downsample(target) {
  const out = Buffer.alloc(target * target * 4);
  const f = S / target;
  for (let y = 0; y < target; y++) {
    for (let x = 0; x < target; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = Math.floor(y * f); sy < Math.floor((y + 1) * f); sy++) {
        for (let sx = Math.floor(x * f); sx < Math.floor((x + 1) * f); sx++) {
          const i = (sy * S + sx) * 4;
          const alpha = px[i + 3] / 255;
          r += px[i] * alpha;
          g += px[i + 1] * alpha;
          b += px[i + 2] * alpha;
          a += alpha;
          n++;
        }
      }
      const o = (y * target + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

const dir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(dir, `icon${size}.png`), encodePng(size, downsample(size)));
  console.log(`icons/icon${size}.png`);
}
