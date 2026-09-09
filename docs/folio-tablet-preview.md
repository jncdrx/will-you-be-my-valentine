# Folio two-page tablet preview

Every drug opens with a grouped Front / Page 1 and Back / Page 2 spread, including records that continue to later pages. Further pages pair as Page 3 and Page 4; an unpaired final continuation remains available through the page selector. Tap a page or its heading to select it for editing. The active page retains the existing inline editing and resize handlers; its companion uses the same printable SVG renderer and shared handwriting assets.

Touch sessions start in Fit page without changing the saved paper settings. The iPad landscape layout places controls in a side column. Larger numeric zoom levels stack pages when two enlarged sheets would exceed the available width. Narrow screens also stack; all scaling preserves the physical page aspect ratio. Print and export page dimensions remain unchanged.

## Verification

- `node --test tests/folio-spread.node.mjs`: both public entry points pass grouping, page selection, handwriting asset resolution, and unchanged print-output checks.
- `pnpm build`: passes.
- WebKit with touch enabled and device scale factor 2: 820×1180 and 1180×820 CSS pixels, plus 820×1060 and 1180×680 reduced viewports. Both pages are equal-sized, aligned, and contained without horizontal scrolling.
- Additional layouts: 600×900, 390×844; embedded Folio component at both iPad orientations and reduced landscape height; desktop at 1920×1080 and 1366×768.
- Browser checks cover editing the back page, persistence across reload, numeric section resizing, 44-pixel resize targets, and removing resize handles in Type mode. The section dialog stays within 820×1180, 1180×680, and 1180×430 viewports.
- A real pointer drag changed the selected section width from 122 mm to 117.48 mm, retained the selected section and visible controls after release, and reset successfully. Touch taps were tested separately; physical finger dragging still requires hardware verification.
- Zoom 100%, 125%, and 150% produces successively larger previews with vertical stacking and no horizontal overflow on the touch landscape viewport.

Screenshots and browser check scripts are retained locally under `output/playwright/`.

## Proof boundaries

These are WebKit emulation checks, not tests on physical iPad hardware. Native Safari keyboard, pinch, browser chrome, and safe-area behavior still need device verification. The embedded component was rendered in a local fixture because the full application requires sign-in; no authentication or cloud-data behavior was changed.

The older Folio Node suites encounter an existing JSDOM setup failure (`matchMedia is not defined`). The same failure was reproduced using unchanged HEAD HTML for the section-resize suite. The new spread suite supplies the browser API stub and runs the complete editor script. No claim is made that the entire older suite passes.
