
// MIFC transect preview.
//
// Draws the plants of a MIFC inventory as inline SVG (no libraries): a
// top-down plan view of the transect and a side profile view. The same SVG is
// shown in a modal and rasterised to PNG for the downloaded ZIP.
//
// The preview never changes the data. It only flags values to review.

import { checkRange } from './classes.js';

/** Length of the MIFC transect (10 m), in centimeters. */
export const TRANSECT_LENGTH_CM = 1000;

/** Columns that must exist in inv_columns to draw the preview. */
export const REQUIRED_COLUMNS = [
  'species', 'd', 'dl', 'dr', 'h', 'dma', 'dmi', 'rma', 'rmi', 'dbh_cm'
];

// Numeric columns read from each row
const NUMERIC_KEYS = ['d', 'dl', 'dr', 'h', 'dma', 'dmi', 'rma', 'rmi', 'dbh_cm'];
// Belt half-width drawn around the tape (1 m)
const BELT_HALF_WIDTH_CM = 100;
// Fixed categorical colours, assigned in order of first appearance
const SPECIES_PALETTE = [
  '#0072b2', '#e69f00', '#009e73', '#cc79a7',
  '#56b4e9', '#d55e00', '#8c564b', '#7f7f7f'
];
const FLAG_COLOR = '#d62728';
const TEXT_COLOR = '#222222';
const MUTED_COLOR = '#777777';
// Radius (px) of the dot drawn for plants without crown measures
const DOT_RADIUS = 4;
// Drawing area: 1 px = 1 cm along the tape
const MARGIN = { top: 30, right: 50, bottom: 40, left: 60 };
const VIEW_WIDTH = MARGIN.left + TRANSECT_LENGTH_CM + MARGIN.right;
const PROFILE_PLOT_HEIGHT = 300;
// Warnings listed at the bottom of the PNG
const MAX_PNG_WARNINGS = 10;

/**
 * Check whether the loaded configuration is the official MIFC one.
 *
 * @returns {Boolean} True when `inv_type === 'MIFC'` and every required
 *   column exists in inv_columns.
 */
export function isMifcInventory() {
  if (globalThis.inv_type !== 'MIFC') return false;
  const cols = globalThis.inv_columns;
  return !!cols && REQUIRED_COLUMNS.every((key) => key in cols);
}

/**
 * Add the "Preview" button next to the row controls (MIFC only).
 *
 * @returns {HTMLButtonElement|null} The button, or null when not added.
 */
export function initPreviewButton() {
  if (!isMifcInventory() || document.getElementById('row-btn-preview')) return null;
  const anchor = document.getElementById('row-btn-img');
  if (!anchor) return null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'row-btn-preview';
  btn.textContent = 'Preview';
  anchor.after(' ', btn);
  return btn;
}

/** Parse a cell value. Blank or non-numeric values become null. */
function toNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/** Crown axes from a pair of measures. One axis only gives a circle. */
function crownAxes(major, minor) {
  if (major === null && minor === null) return null;
  if (major === null) return { major: minor, minor };
  if (minor === null) return { major, minor: major };
  return { major, minor };
}

/**
 * Normalise inventory rows into plants.
 *
 * - `x` is `d`; `y` is `+dl` (left) or `-dr` (right), 0 when neither is
 *   filled and null when both are (ambiguous side).
 * - The crown is `2·rma × 2·rmi` when radii exist, otherwise `dma × dmi`.
 *
 * @param {Array<Object>} rows Row objects or plain row dicts.
 * @returns {Array<Object>} {rown, species, x, y, h, crownMajor, crownMinor,
 *   dbh, raw}. `raw` keeps the parsed numeric columns.
 */
export function rowsToPlants(rows) {
  return rows.map((row, i) => {
    const raw = {};
    NUMERIC_KEYS.forEach((key) => { raw[key] = toNumber(row[key]); });

    let y;
    if (raw.dl !== null && raw.dr !== null) {
      y = null;
    } else if (raw.dl !== null) {
      y = raw.dl;
    } else if (raw.dr !== null) {
      y = -raw.dr;
    } else {
      y = 0;
    }

    let crown;
    if (raw.rma !== null || raw.rmi !== null) {
      const radii = crownAxes(raw.rma, raw.rmi);
      crown = { major: 2 * radii.major, minor: 2 * radii.minor };
    } else {
      crown = crownAxes(raw.dma, raw.dmi);
    }

    return {
      rown: Number(row.rown) || i + 1,
      species: String(row.species ?? '').trim(),
      x: raw.d,
      y,
      h: raw.h,
      crownMajor: crown ? crown.major : null,
      crownMinor: crown ? crown.minor : null,
      dbh: raw.dbh_cm,
      raw
    };
  });
}

/**
 * Flag plants with range issues (checkRange) and MIFC-only checks.
 *
 * Errors make a plant not drawable; warnings only mark it.
 *
 * @param {Array<Object>} plants rowsToPlants() result.
 * @returns {{plants: Array<Object>, warnings: Array<Object>}} Plants with
 *   `flags` and `drawable`, and the flat list of {rown, level, key, reason}.
 */
export function validatePlants(plants) {
  const warnings = [];

  const checked = plants.map((plant) => {
    const raw = plant.raw ?? {};
    const has = (key) => raw[key] !== null && raw[key] !== undefined;
    const flags = [];
    const add = (level, key, reason) => flags.push({ level, key, reason });

    // Global min/max thresholds from the config
    NUMERIC_KEYS.forEach((key) => {
      const issue = checkRange(key, raw[key]);
      if (issue) add('warning', key, issue.reason);
    });

    // MIFC-only checks
    if (!has('d')) {
      add('error', 'd', 'd is missing; plant not drawn');
    }
    if (has('dl') && has('dr')) {
      add('error', 'dl', 'both dl and dr are filled (side is ambiguous); plant not drawn');
    } else if (!has('dl') && !has('dr')) {
      add('warning', 'dl', 'neither dl nor dr is filled; drawn on the tape line');
    }
    if (has('dma') && has('dmi') && raw.dmi > raw.dma) {
      add('warning', 'dmi', `minor axis dmi (${fmt(raw.dmi)}) is larger than major axis dma (${fmt(raw.dma)})`);
    }
    if (has('rma') && has('rmi') && raw.rmi > raw.rma) {
      add('warning', 'rmi', `minor axis rmi (${fmt(raw.rmi)}) is larger than major axis rma (${fmt(raw.rma)})`);
    }
    if ((has('dma') || has('dmi')) && (has('rma') || has('rmi'))) {
      add('warning', 'dma', 'both dma/dmi and rma/rmi are filled; radii are used');
    }

    flags.forEach((f) => warnings.push({ rown: plant.rown, ...f }));
    return {
      ...plant,
      flags,
      drawable: !flags.some((f) => f.level === 'error')
    };
  });

  return { plants: checked, warnings };
}

/** Validate the plants unless validatePlants() already did it. */
function ensureValidated(plants) {
  return plants.every((p) => Array.isArray(p.flags))
    ? plants
    : validatePlants(plants).plants;
}

/** Flat warnings list from validated plants. */
function collectWarnings(plants) {
  return plants.flatMap((p) => p.flags.map((f) => ({ rown: p.rown, ...f })));
}

/**
 * Assign a fixed colour to each species, in order of first appearance.
 *
 * @param {Array<Object>} plants
 * @returns {Map<String, String>} species -> colour
 */
export function speciesColors(plants) {
  const colors = new Map();
  plants.forEach((p) => {
    const name = speciesName(p);
    if (!colors.has(name)) {
      colors.set(name, SPECIES_PALETTE[colors.size % SPECIES_PALETTE.length]);
    }
  });
  return colors;
}

function speciesName(plant) {
  return plant.species || 'Unknown species';
}

/** Keep a value inside [min, max]. */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Format a number with at most two decimals. */
function fmt(n) {
  return n === null || n === undefined ? '–' : String(Math.round(n * 100) / 100);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Short text describing a plant (tooltip and SVG <title>). */
function plantLabel(plant) {
  return `Row ${plant.rown}: ${speciesName(plant)} · ` +
    `h ${fmt(plant.h)} cm · DBH ${fmt(plant.dbh)} cm`;
}

/** Wrap a view body into a standalone <svg> document. */
function svgDoc({ width, height, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" font-family="sans-serif" font-size="13" ` +
    `fill="${TEXT_COLOR}">` +
    `<rect width="${width}" height="${height}" fill="#ffffff"/>${body}</svg>`;
}

/**
 * One plant group. Flagged plants get a red dashed outline and a "!" marker.
 *
 * @param {Object} plant Validated plant.
 * @param {String} color Species colour.
 * @param {String} shapes Inner SVG shapes; `STROKE` is replaced by the
 *   outline attributes.
 * @param {Number} markX "!" marker position.
 * @param {Number} markY
 */
function plantGroup(plant, color, shapes, markX, markY) {
  const flagged = plant.flags.length > 0;
  const stroke = flagged
    ? `stroke="${FLAG_COLOR}" stroke-width="2.5" stroke-dasharray="6 4"`
    : `stroke="${color}" stroke-width="1.5"`;
  const marker = flagged
    ? `<text x="${markX}" y="${markY}" fill="${FLAG_COLOR}" font-size="16" font-weight="bold">!</text>`
    : '';
  return `<g class="plant${flagged ? ' plant--flagged' : ''}" data-rown="${plant.rown}">` +
    `<title>${escapeXml(plantLabel(plant))}</title>` +
    `${shapes.replaceAll('STROKE', stroke)}${marker}</g>`;
}

/** Ticks and labels every 100 cm along the tape. */
function tapeTicks(y, labelY) {
  let out = '';
  for (let d = 0; d <= TRANSECT_LENGTH_CM; d += 100) {
    const x = MARGIN.left + d;
    out += `<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" stroke="${TEXT_COLOR}"/>` +
      `<text x="${x}" y="${labelY}" text-anchor="middle" font-size="11">${d}</text>`;
  }
  return out + `<text x="${MARGIN.left + TRANSECT_LENGTH_CM + 12}" y="${labelY}" font-size="11">cm</text>`;
}

function planView(plants, inventory = {}) {
  const colors = speciesColors(plants);
  const drawn = plants.filter((p) => p.drawable);

  // Vertical extent (cm each side of the tape), so crowns fit
  const reach = drawn.map((p) => Math.abs(p.y) + (p.crownMinor ?? 0) / 2);
  const extent = Math.min(400, Math.max(BELT_HALF_WIDTH_CM + 20, ...reach) + 10);
  const height = MARGIN.top + 2 * extent + MARGIN.bottom;
  const tapeY = MARGIN.top + extent;
  const sx = (d) => MARGIN.left + d;
  const sy = (offset) => tapeY - offset;

  let body = '';
  // Belt and tape
  body += `<rect x="${sx(0)}" y="${sy(BELT_HALF_WIDTH_CM)}" width="${TRANSECT_LENGTH_CM}" ` +
    `height="${2 * BELT_HALF_WIDTH_CM}" fill="#f2f2f2" stroke="#cccccc" stroke-dasharray="4 4"/>`;
  body += `<line x1="${sx(0)}" y1="${tapeY}" x2="${sx(TRANSECT_LENGTH_CM)}" y2="${tapeY}" ` +
    `stroke="${TEXT_COLOR}" stroke-width="2"/>`;
  body += tapeTicks(tapeY, height - MARGIN.bottom + 18);
  // Sides
  body += `<text x="${MARGIN.left - 8}" y="${sy(BELT_HALF_WIDTH_CM / 2)}" text-anchor="end" ` +
    `fill="${MUTED_COLOR}" font-size="11">Left</text>`;
  body += `<text x="${MARGIN.left - 8}" y="${sy(-BELT_HALF_WIDTH_CM / 2)}" text-anchor="end" ` +
    `fill="${MUTED_COLOR}" font-size="11">Right</text>`;
  // Start/end point IDs
  const pointLabel = (value, x, anchor) => (value === undefined || value === null || value === '')
    ? ''
    : `<text x="${x}" y="${MARGIN.top - 10}" text-anchor="${anchor}" font-weight="bold">` +
      `Point ${escapeXml(value)}</text>`;
  body += pointLabel(inventory.init_point_id, sx(0), 'start');
  body += pointLabel(inventory.final_point_id, sx(TRANSECT_LENGTH_CM), 'end');

  // Plants: largest crowns first so small ones stay visible on top
  const area = (p) => (p.crownMajor ?? 0) * (p.crownMinor ?? 0);
  [...drawn].sort((a, b) => area(b) - area(a)).forEach((p) => {
    const color = colors.get(speciesName(p));
    // Plants outside the drawing (typos such as d = 9800) are pinned to its
    // edge and labelled with their real position, so they stay visible
    const px = clamp(p.x, 0, TRANSECT_LENGTH_CM);
    const py = clamp(p.y, -extent, extent);
    const cx = sx(px);
    const cy = sy(py);
    const rx = p.crownMajor ? p.crownMajor / 2 : DOT_RADIUS;
    const ry = p.crownMinor ? p.crownMinor / 2 : DOT_RADIUS;
    let shapes = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" ` +
      `fill-opacity="0.45" STROKE/>`;
    if (px !== p.x || py !== p.y) {
      const side = p.y > 0 ? `dl ${fmt(p.y)}` : p.y < 0 ? `dr ${fmt(-p.y)}` : '';
      shapes += `<text x="${cx}" y="${cy + ry + 14}" text-anchor="middle" fill="${FLAG_COLOR}" ` +
        `font-size="11">${escapeXml([`d ${fmt(p.x)}`, side].filter(Boolean).join(', '))}</text>`;
    }
    body += plantGroup(p, color, shapes, cx + rx + 2, cy - ry + 4);
  });

  return { width: VIEW_WIDTH, height, body };
}

/** Linear-interpolated percentile of a non-empty array. */
function percentile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Top of the profile y-axis: the configured `h` maximum, or the 95th
 * percentile × 1.2 when that is lower, so one typo doesn't flatten the chart.
 */
function profileMax(heights) {
  if (heights.length === 0) return 100;
  const configMax = globalThis.inv_columns?.h?.max;
  const limit = typeof configMax === 'number' ? configMax : Infinity;
  const yMax = Math.min(limit, percentile(heights, 0.95) * 1.2);
  return yMax > 0 ? yMax : Math.max(...heights, 1);
}

/** A "nice" tick step giving about five ticks up to max. */
function niceStep(max) {
  const rough = max / 5;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / pow;
  return pow * (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10);
}

function profileView(plants) {
  const colors = speciesColors(plants);
  const drawn = plants.filter((p) => p.drawable && p.h !== null);
  const yMax = profileMax(drawn.map((p) => p.h));

  const height = MARGIN.top + PROFILE_PLOT_HEIGHT + MARGIN.bottom;
  const groundY = MARGIN.top + PROFILE_PLOT_HEIGHT;
  const sx = (d) => MARGIN.left + d;
  const sy = (h) => groundY - (Math.min(Math.max(h, 0), yMax) / yMax) * PROFILE_PLOT_HEIGHT;

  let body = '';
  // Y axis with ticks
  const step = niceStep(yMax);
  for (let h = 0; h <= yMax + 1e-9; h += step) {
    const y = sy(h);
    body += `<line x1="${sx(0)}" y1="${y}" x2="${sx(TRANSECT_LENGTH_CM)}" y2="${y}" stroke="#eeeeee"/>` +
      `<text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end" font-size="11">${fmt(h)}</text>`;
  }
  body += `<text x="${MARGIN.left - 8}" y="${MARGIN.top - 12}" text-anchor="end" font-size="11">h (cm)</text>`;
  body += `<line x1="${sx(0)}" y1="${MARGIN.top}" x2="${sx(0)}" y2="${groundY}" stroke="${TEXT_COLOR}"/>`;
  // Ground (tape) with ticks
  body += `<line x1="${sx(0)}" y1="${groundY}" x2="${sx(TRANSECT_LENGTH_CM)}" y2="${groundY}" ` +
    `stroke="${TEXT_COLOR}" stroke-width="2"/>`;
  body += tapeTicks(groundY, groundY + 18);

  // Tallest plants first so short ones stay visible on top
  [...drawn].sort((a, b) => b.h - a.h).forEach((p) => {
    const color = colors.get(speciesName(p));
    // Pinned to the transect ends when d is out of range
    const x = sx(clamp(p.x, 0, TRANSECT_LENGTH_CM));
    const topY = sy(p.h);
    const clipped = p.h > yMax;

    let shapes = `<line x1="${x}" y1="${groundY}" x2="${x}" y2="${topY}" stroke="${color}" stroke-width="2"/>`;
    let rx = DOT_RADIUS;
    let ry = DOT_RADIUS;
    if (p.crownMajor) {
      rx = p.crownMajor / 2;
      ry = Math.min(40, Math.max(3, (groundY - topY) * 0.3));
      shapes += `<ellipse cx="${x}" cy="${topY + ry}" rx="${rx}" ry="${ry}" fill="${color}" ` +
        `fill-opacity="0.45" STROKE/>`;
    } else {
      shapes += `<circle cx="${x}" cy="${topY}" r="${DOT_RADIUS}" fill="${color}" STROKE/>`;
    }
    if (clipped) {
      // Cut off at the top: arrow plus the real value
      shapes += `<path d="M ${x - 6} ${topY + 8} L ${x} ${topY} L ${x + 6} ${topY + 8}" ` +
        `fill="none" stroke="${FLAG_COLOR}" stroke-width="2"/>` +
        `<text x="${x}" y="${topY - 6}" text-anchor="middle" fill="${FLAG_COLOR}" ` +
        `font-size="11">${fmt(p.h)}</text>`;
    }
    body += plantGroup(p, color, shapes, x + rx + 2, topY + 4);
  });

  return { width: VIEW_WIDTH, height, body };
}

function legendView(plants) {
  const colors = speciesColors(plants);
  const counts = new Map();
  plants.forEach((p) => {
    const name = speciesName(p);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const items = [...colors].map(([name, color]) => ({
    label: `${name} (${counts.get(name)})`,
    swatch: `<rect width="14" height="14" fill="${color}" fill-opacity="0.45" stroke="${color}"/>`
  }));
  if (plants.some((p) => p.flags.length > 0)) {
    items.push({
      label: 'Flagged value',
      swatch: `<rect width="14" height="14" fill="none" stroke="${FLAG_COLOR}" ` +
        `stroke-width="2" stroke-dasharray="4 3"/>`
    });
  }

  // Flow the items into lines (text width estimated from its length)
  const lineHeight = 22;
  let x = MARGIN.left;
  let y = 10;
  let body = '';
  items.forEach((item) => {
    const itemWidth = 24 + item.label.length * 7.5 + 20;
    if (x + itemWidth > VIEW_WIDTH - MARGIN.right && x > MARGIN.left) {
      x = MARGIN.left;
      y += lineHeight;
    }
    body += `<g transform="translate(${x},${y})">${item.swatch}` +
      `<text x="22" y="12">${escapeXml(item.label)}</text></g>`;
    x += itemWidth;
  });

  return { width: VIEW_WIDTH, height: y + lineHeight + 4, body };
}

function warningsView(warnings) {
  const lineHeight = 18;
  let y = 20;
  let body = `<text x="${MARGIN.left}" y="${y}" font-weight="bold">Warnings (${warnings.length})</text>`;
  if (warnings.length === 0) {
    y += lineHeight;
    body += `<text x="${MARGIN.left}" y="${y}" fill="${MUTED_COLOR}">No warnings.</text>`;
  }
  warnings.slice(0, MAX_PNG_WARNINGS).forEach((w) => {
    y += lineHeight;
    const color = w.level === 'error' ? FLAG_COLOR : TEXT_COLOR;
    body += `<text x="${MARGIN.left}" y="${y}" fill="${color}">` +
      `${escapeXml(`Row ${w.rown}: ${w.reason}`)}</text>`;
  });
  if (warnings.length > MAX_PNG_WARNINGS) {
    y += lineHeight;
    body += `<text x="${MARGIN.left}" y="${y}" fill="${MUTED_COLOR}">` +
      `…and ${warnings.length - MAX_PNG_WARNINGS} more</text>`;
  }
  return { width: VIEW_WIDTH, height: y + 12, body };
}

/**
 * Top-down view of the transect (0–1000 cm). Left side above the tape,
 * right side below. Crowns are ellipses (major axis along the tape) or
 * circles; plants without crown are small dots.
 *
 * @param {Array<Object>} plants
 * @param {Object} inventory Inventory metadata (start/end point IDs).
 * @returns {String} SVG markup.
 */
export function renderPlanView(plants, inventory = {}) {
  return svgDoc(planView(ensureValidated(plants), inventory));
}

/**
 * Side view: x = d, y = h. Each plant is a stem plus a crown of width
 * crownMajor. Plants above the axis top are cut off with an arrow and label.
 *
 * @param {Array<Object>} plants
 * @returns {String} SVG markup.
 */
export function renderProfileView(plants) {
  return svgDoc(profileView(ensureValidated(plants)));
}

/**
 * Species swatches with counts (plus the flagged marker when needed).
 *
 * @param {Array<Object>} plants
 * @returns {String} SVG markup.
 */
export function renderLegend(plants) {
  return svgDoc(legendView(ensureValidated(plants)));
}

/**
 * Clickable warnings list. Each item carries `data-rown` and `data-key`.
 *
 * @param {Array<Object>} warnings validatePlants() warnings.
 * @returns {HTMLUListElement}
 */
export function renderWarnings(warnings) {
  const list = document.createElement('ul');
  list.classList.add('preview-warnings');
  if (warnings.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No warnings.';
    list.appendChild(li);
    return list;
  }
  warnings.forEach((w) => {
    const li = document.createElement('li');
    li.classList.add('preview-warning', `preview-warning--${w.level}`);
    li.dataset.rown = w.rown;
    li.dataset.key = w.key;
    li.textContent = `Row ${w.rown}: ${w.reason}`;
    list.appendChild(li);
  });
  return list;
}

/**
 * One combined SVG: title, plan view, profile view, legend and warnings.
 * Used for the PNG.
 *
 * @param {Array<Object>} plants
 * @param {Object} inventory Inventory metadata.
 * @returns {String} SVG markup.
 */
export function buildPreviewSvg(plants, inventory = {}) {
  const checked = ensureValidated(plants);
  const sections = [
    ['Plan view (top-down)', planView(checked, inventory)],
    ['Profile view (side)', profileView(checked)],
    [null, legendView(checked)],
    [null, warningsView(collectWarnings(checked))]
  ];

  const title = inventory.name ? `Transect ${inventory.name}` : 'Transect preview';
  let y = 36;
  let body = `<text x="${MARGIN.left}" y="${y}" font-size="20" font-weight="bold">` +
    `${escapeXml(title)}</text>`;
  y += 16;
  sections.forEach(([heading, view]) => {
    if (heading) {
      y += 22;
      body += `<text x="${MARGIN.left}" y="${y}" font-size="15" font-weight="bold">${heading}</text>`;
    }
    body += `<g transform="translate(0,${y})">${view.body}</g>`;
    y += view.height;
  });

  return svgDoc({ width: VIEW_WIDTH, height: y + 10, body });
}

/**
 * Rasterise an SVG to PNG through a <canvas>. Works offline.
 *
 * @param {String|SVGSVGElement} svg Markup with width/height attributes.
 * @param {Number} scale Pixel ratio of the output.
 * @returns {Promise<Blob>}
 */
export function svgToPngBlob(svg, scale = 2) {
  const markup = typeof svg === 'string' ? svg : new XMLSerializer().serializeToString(svg);
  const rootTag = markup.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const width = parseFloat(rootTag.match(/\swidth="([\d.]+)"/)?.[1]);
  const height = parseFloat(rootTag.match(/\sheight="([\d.]+)"/)?.[1]);

  return new Promise((resolve, reject) => {
    if (!(width > 0 && height > 0)) {
      reject(new Error('The SVG needs numeric width and height attributes.'));
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error('PNG encoding failed.'));
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('The preview SVG could not be loaded.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}

/** Get (or create) the modal container and its overlay. */
function previewContainer() {
  let container = document.getElementById('preview-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'preview-container';
    container.classList.add('preview-container');
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  return container;
}

/** Close the preview modal. */
export function closePreview() {
  const container = document.getElementById('preview-container');
  if (container) container.style.display = 'none';
  const overlay = document.getElementById('block-app-div');
  if (overlay) overlay.style.display = 'none';
}

/**
 * Highlight a row's input in the form (or the whole row as a fallback).
 *
 * @param {Number|String} rown Row number.
 * @param {String} key Column name.
 */
export function highlightRow(rown, key) {
  document.querySelectorAll('.preview-highlight')
    .forEach((el) => el.classList.remove('preview-highlight'));
  const el = document.getElementById(`${key}-${rown}`) ??
    document.getElementById(`rown-${rown}`);
  if (!el) return;
  el.classList.add('preview-highlight');
  el.addEventListener('input', () => el.classList.remove('preview-highlight'), { once: true });
  el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  el.focus?.({ preventScroll: true });
}

/**
 * Show the preview modal with Plan / Profile tabs, the legend and the
 * warnings list. Tapping a plant shows its row, species, h and DBH; tapping a
 * warning closes the preview and highlights that row's input.
 *
 * @param {Array<Object>} plants rowsToPlants() (or validatePlants()) result.
 * @param {Object} inventory Inventory metadata.
 * @param {Object} options
 * @param {Function} options.onWarning Called with (rown, key) after a
 *   warning is tapped, instead of highlightRow(). Use it when the rows are
 *   not in the form yet (e.g. preview from the saved inventories list).
 * @returns {HTMLElement} The modal container.
 */
export function openPreview(plants, inventory = {}, { onWarning = highlightRow } = {}) {
  const checked = ensureValidated(plants);
  const warnings = collectWarnings(checked);
  const views = {
    plan: () => renderPlanView(checked, inventory),
    profile: () => renderProfileView(checked)
  };

  const container = previewContainer();
  container.innerHTML = '';
  const panel = document.createElement('div');
  panel.classList.add('preview-panel');
  panel.innerHTML =
    `<div id="close-preview-container" class="cross-to-close"><span>x</span></div>` +
    `<h2>${escapeXml(inventory.name ? `Transect ${inventory.name}` : 'Transect preview')}</h2>` +
    `<div class="preview-tabs" role="tablist">` +
      `<button type="button" role="tab" data-view="plan" aria-selected="true" class="active">Plan</button>` +
      `<button type="button" role="tab" data-view="profile" aria-selected="false">Profile</button>` +
    `</div>` +
    `<div class="preview-view preview-scroll"></div>` +
    `<p class="preview-tooltip" aria-live="polite">Tap a plant to see its data.</p>` +
    `<div class="preview-legend"></div>` +
    `<h3>Warnings (${warnings.length})</h3>`;
  panel.appendChild(renderWarnings(warnings));
  container.appendChild(panel);

  const viewEl = panel.querySelector('.preview-view');
  const tooltipEl = panel.querySelector('.preview-tooltip');
  viewEl.innerHTML = views.plan();
  panel.querySelector('.preview-legend').innerHTML = renderLegend(checked);

  panel.addEventListener('click', (event) => {
    const target = event.target;
    if (target.closest('#close-preview-container')) {
      closePreview();
      return;
    }

    const tab = target.closest('[data-view]');
    if (tab) {
      panel.querySelectorAll('[data-view]').forEach((btn) => {
        const active = btn === tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      viewEl.innerHTML = views[tab.dataset.view]();
      return;
    }

    const plantEl = target.closest('.plant');
    if (plantEl) {
      const plant = checked.find((p) => String(p.rown) === plantEl.dataset.rown);
      if (plant) {
        const issues = plant.flags.map((f) => f.reason).join('; ');
        tooltipEl.textContent = plantLabel(plant) + (issues ? ` — ${issues}` : '');
      }
      return;
    }

    const warningEl = target.closest('.preview-warning');
    if (warningEl) {
      closePreview();
      onWarning(warningEl.dataset.rown, warningEl.dataset.key);
    }
  });

  container.style.display = 'block';
  const overlay = document.getElementById('block-app-div');
  if (overlay) overlay.style.display = 'block';
  return container;
}
