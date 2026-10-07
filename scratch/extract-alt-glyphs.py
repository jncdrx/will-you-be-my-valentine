"""Cut a second set of handwriting samples out of two sticky-note photos.

Input : two photos (uppercase A-Z; lowercase a-z + digits 0-9) given on the command line.
Output: a JSON file {char: {src,w,h,rel,desc,origin}} in the same convention as the
        app's built-in `glyph-data`, plus a debug overlay PNG for eyeballing the cuts.

Usage: python scratch/extract-alt-glyphs.py UPPER.webp LOWER.webp OUT.json DEBUG_DIR [folio.html]
Only PIL + numpy are required.
"""
import base64, io, json, math, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

UPPER_ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRST', 'UVWX', 'YZ']
LOWER_ROWS = ['abcdefg', 'hijklmn', 'opqrstu', 'vwxyz', '0912345678']
# Alpha ramp for the ink: a slightly higher floor keeps this pen's strokes as light as the built-in sample.
ALPHA_LO = float(os.environ.get('ALT_ALPHA_LO', 60)); ALPHA_SPAN = float(os.environ.get('ALT_ALPHA_SPAN', 60))
XHEIGHT = set('acemnorsuvwxz')
DESCENDERS = set('gjpqy')


def load_base(html_path):
    """Built-in glyph metrics (rel/desc) so the new samples share the same vertical envelope."""
    import re
    text = open(html_path, encoding='utf-8').read()
    return json.loads(re.search(r'<script id="glyph-data"[^>]*>(.*?)</script>', text, re.S).group(1))


def ink_maps(im):
    gray = np.asarray(im.convert('L'), dtype=np.float32)
    g8 = Image.fromarray(gray.astype('uint8'))
    # Paper brightness (and shadows) estimated by a wide max filter + blur, so strokes do not pull it down.
    bg = np.asarray(g8.filter(ImageFilter.MaxFilter(51)).filter(ImageFilter.GaussianBlur(25)), dtype=np.float32)
    return np.clip(bg - gray, 0, 255), bg


def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    ys, xs = np.nonzero(mask)
    comps = []
    for y0, x0 in zip(ys, xs):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; pix = []
        while q:
            y, x = q.popleft(); pix.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True; q.append((yy, xx))
        p = np.array(pix)
        comps.append({'pix': p, 'x0': p[:, 1].min(), 'x1': p[:, 1].max(), 'y0': p[:, 0].min(), 'y1': p[:, 0].max(), 'n': len(p)})
    return comps


def box_merge(a, b):
    p = np.vstack([a['pix'], b['pix']])
    return {'pix': p, 'x0': min(a['x0'], b['x0']), 'x1': max(a['x1'], b['x1']), 'y0': min(a['y0'], b['y0']), 'y1': max(a['y1'], b['y1']), 'n': len(p)}


def merge_parts(comps, med_h):
    """Join dots and detached strokes with the letter they belong to (overlapping x range, close in y)."""
    changed = True
    while changed:
        changed = False
        comps.sort(key=lambda c: -c['n'])
        for i, a in enumerate(comps):
            for j in range(i + 1, len(comps)):
                b = comps[j]
                ov = min(a['x1'], b['x1']) - max(a['x0'], b['x0'])
                narrow = min(a['x1'] - a['x0'], b['x1'] - b['x0']) + 1
                gap = max(a['y0'], b['y0']) - min(a['y1'], b['y1'])
                if ov > 0.3 * narrow and gap < 0.9 * med_h and (b['n'] < 0.25 * a['n'] or gap <= 3):
                    comps[i] = box_merge(a, b); del comps[j]; changed = True; break
            if changed:
                break
    return comps


def estimate_tilt(rows):
    """Slope of row baselines (bottom edge vs x) across non-descender glyphs; returns degrees."""
    xs, ys = [], []
    for row in rows:
        for c in row:
            xs.append((c['x0'] + c['x1']) / 2); ys.append(c['y1'] - 0.0)
    # fit per-row offsets out: regress y on x with a per-row intercept
    num = den = 0.0
    for row in rows:
        rx = np.array([(c['x0'] + c['x1']) / 2 for c in row], dtype=float); ry = np.array([c['y1'] for c in row], dtype=float)
        rx -= rx.mean(); ry -= np.median(ry)
        keep = np.abs(ry) < 40
        num += (rx[keep] * ry[keep]).sum(); den += (rx[keep] ** 2).sum()
    return math.degrees(math.atan2(num, den)) if den else 0.0


def segment(path, layout, min_px=60):
    im = Image.open(path).convert('RGB')
    for attempt in range(2):
        diff, bg = ink_maps(im)
        mask = diff > 38
        # Drop paper edges / table shadows: anything far bigger than a letter, or hugging the photo border.
        H, W = mask.shape
        comps = [c for c in components(mask) if c['n'] >= min_px and (c['x1'] - c['x0']) < 0.3 * W and (c['y1'] - c['y0']) < 0.2 * H]
        # Real pen strokes are far darker than table grain or the paper edge (mean contrast ~90-120 vs <=75),
        # and never touch the photo border.
        comps = [c for c in comps if diff[c['pix'][:, 0], c['pix'][:, 1]].mean() >= 80 and min(c['x0'], c['y0']) > 4 and c['x1'] < W - 5 and c['y1'] < H - 5]
        med_h = float(np.median([c['y1'] - c['y0'] + 1 for c in comps if c['n'] > 200] or [60]))
        comps = merge_parts(comps, med_h)
        comps = [c for c in comps if c['n'] >= 120 and (c['y1'] - c['y0']) > 0.25 * med_h]
        comps.sort(key=lambda c: (c['y0'] + c['y1']) / 2)
        # rows: new row when the vertical centre jumps by more than ~0.9 cap height
        rows, cur = [], []
        for c in comps:
            cy = (c['y0'] + c['y1']) / 2
            if cur and cy - np.mean([(k['y0'] + k['y1']) / 2 for k in cur]) > 0.9 * med_h:
                rows.append(cur); cur = []
            cur.append(c)
        if cur:
            rows.append(cur)
        for r in rows:
            r.sort(key=lambda c: c['x0'])
        if attempt == 0:
            tilt = estimate_tilt([r for r in rows if len(r) > 2])
            if abs(tilt) > 0.4:
                im = im.rotate(tilt, resample=Image.BICUBIC, fillcolor=(255, 255, 255)); print(f'  de-rotated {tilt:.2f} deg')
                continue
        break
    return im, rows, diff, bg, med_h


def to_png(alpha_arr, scale):
    h, w = alpha_arr.shape
    img = Image.fromarray(alpha_arr.astype('uint8'), 'L')
    if scale != 1:
        img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    a = np.asarray(img)
    ys, xs = np.nonzero(a > 30)
    img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    out = Image.new('LA', (img.width + 6, img.height + 6), (0, 0))
    out.paste(Image.merge('LA', (Image.new('L', img.size, 0), img)), (3, 3))
    buf = io.BytesIO(); out.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), out.width, out.height


def build(path, layout, debug_dir, tag, target_h, base_glyphs):
    print(path)
    im, rows, diff, bg, med_h = segment(path, layout)
    print('  rows:', [len(r) for r in rows], 'expected', [len(s) for s in layout])
    dbg = im.copy(); d = ImageDraw.Draw(dbg)
    out = {}
    if [len(r) for r in rows] != [len(s) for s in layout]:
        for ri, r in enumerate(rows):
            for c in r:
                d.rectangle([c['x0'], c['y0'], c['x1'], c['y1']], outline=(255, 0, 0), width=3)
        dbg.save(os.path.join(debug_dir, f'{tag}-debug.png'))
        raise SystemExit('row/column counts do not match the layout; inspect the debug image')
    # pixel size of one "cap" in this photo, from characters whose relation to cap height is known
    heights = {}
    for ri, (row, chars) in enumerate(zip(rows, layout)):
        for c, ch in zip(row, chars):
            heights[ch] = c['y1'] - c['y0'] + 1
    if tag == 'lower':
        cap_px = float(np.median([heights[c] for c in heights if c in XHEIGHT])) / 0.74
    else:
        cap_px = float(np.median(list(heights.values())))
    scale = target_h / cap_px
    for ri, (row, chars) in enumerate(zip(rows, layout)):
        # baseline of the row: median bottom of glyphs that sit on it
        base = float(np.median([c['y1'] for c, ch in zip(row, chars) if ch not in DESCENDERS]))
        for c, ch in zip(row, chars):
            x0, x1, y0, y1 = c['x0'], c['x1'], c['y0'], c['y1']
            pad = 4
            sub = np.zeros((y1 - y0 + 1 + 2 * pad, x1 - x0 + 1 + 2 * pad), np.float32)
            region = diff[max(0, y0 - pad):y1 + 1 + pad, max(0, x0 - pad):x1 + 1 + pad]
            # keep only this glyph's own ink so neighbours' strokes do not leak in
            own = np.zeros(sub.shape, bool)
            oy = (c['pix'][:, 0] - y0 + pad); ox = (c['pix'][:, 1] - x0 + pad)
            own[oy, ox] = True
            from PIL import ImageFilter as IF
            own_img = Image.fromarray((own * 255).astype('uint8')).filter(IF.MaxFilter(5))
            own = np.asarray(own_img) > 0
            sub[:region.shape[0], :region.shape[1]] = region
            alpha = np.clip((sub - ALPHA_LO) / ALPHA_SPAN, 0, 1) * 255 * own
            src, w, h = to_png(alpha, scale)
            height = y1 - y0 + 1
            if tag == 'upper' or ch.isdigit():
                rel, desc = 1.0, 0.0
            else:
                # Same height above the baseline as the built-in sample of this letter, so line spacing and
                # clearance are unchanged; descenders keep their own proportion below the baseline.
                b = base_glyphs[ch]
                above_cap = b['rel'] - b['desc']
                if ch in DESCENDERS:
                    above_px = max(1.0, base - y0 + 1); below_px = max(0.0, y1 - base)
                    unit = above_cap / above_px
                    desc = round(min(b['desc'] * 1.2, below_px * unit), 2); rel = round(above_cap + desc, 2)  # stay inside the line clearance
                else:
                    rel, desc = b['rel'], 0.0
            out[ch] = {'src': src, 'w': w, 'h': h, 'rel': rel, 'desc': desc, 'origin': 'photo2', 'scale': 1, 'dy': 0, 'spacing': 0}
            d.rectangle([x0, y0, x1, y1], outline=(255, 0, 0), width=3); d.text((x0, y0 - 14), ch, fill=(0, 0, 255))
    dbg.save(os.path.join(debug_dir, f'{tag}-debug.png'))
    print('  cap_px %.1f scale %.2f' % (cap_px, scale))
    return out


if __name__ == '__main__':
    upper, lower, out_json, debug_dir = sys.argv[1:5]
    os.makedirs(debug_dir, exist_ok=True)
    result = {}
    base_glyphs = load_base(sys.argv[5] if len(sys.argv) > 5 else os.path.join(os.path.dirname(__file__), '..', 'public', 'folio', 'index.html'))
    result.update(build(upper, UPPER_ROWS, debug_dir, 'upper', 70, base_glyphs))
    result.update(build(lower, LOWER_ROWS, debug_dir, 'lower', 62, base_glyphs))
    json.dump(result, open(out_json, 'w'), separators=(',', ':'))
    print(len(result), 'glyphs,', os.path.getsize(out_json), 'bytes')
