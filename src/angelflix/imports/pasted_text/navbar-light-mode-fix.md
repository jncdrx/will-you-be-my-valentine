Continue working on the **existing AngelFlix design in Figma Make**.

Do **not redesign the navbar**.

Fix the current **Light Mode navbar visibility and active-state problem** shown in the existing design.

## CURRENT PROBLEM

In Light Mode, the active navigation item becomes almost invisible because it is using a very light/white text color against the warm light navbar background.

Examples:

* On **Our Memories**, the “Our Memories” navigation label appears white and has very poor contrast.
* On **Favorites**, the “Favorites” navigation label has the same problem.

This is incorrect.

The navbar must remain clearly readable in every state.

---

# FIX THE SHARED NAVBAR COMPONENT

Inspect the existing reusable AngelFlix navbar/navigation component.

Do not manually fix individual pages.

Update the shared navbar component and its semantic color variables so the fix automatically applies to:

* Home
* Our Memories
* Continue Watching
* Favorites
* Search-related navigation
* Any future AngelFlix pages

Dark Mode must remain unchanged unless a token needs to be corrected structurally.

---

# LIGHT MODE NAVBAR COLORS

Use the existing AngelFlix Light Mode design system.

Recommended values:

### Navbar Background

Use:

`#F7F4F1`

or the existing AngelFlix Light Mode primary background token.

The navbar should feel warm rather than pure white.

### Bottom Border

Use a very subtle separator:

`#E4DEDA`

Approximately 1px.

Do not use a heavy shadow.

---

# INACTIVE NAVIGATION ITEMS

Inactive links such as:

Home
Our Memories
Continue Watching
Favorites

should use:

`#625C5E`

or the existing:

**Text / Secondary**

Light Mode token.

They must be clearly readable while remaining less prominent than the selected page.

---

# ACTIVE NAVIGATION ITEM

The currently selected page must NOT use white text.

Use the AngelFlix muted rose brand color.

Recommended:

`#A83E52`

Example:

If the user is on:

**Our Memories**

then:

Our Memories → `#A83E52`

while:

Home → muted gray
Continue Watching → muted gray
Favorites → muted gray

If the user is on:

**Favorites**

then:

Favorites → `#A83E52`

and all other items return to the inactive color.

---

# ACTIVE INDICATOR

Add a subtle active indicator.

Preferred treatment:

* Active text uses AngelFlix muted rose
* Font weight increases slightly, approximately Medium/Semibold
* Add a small 2px accent line underneath the active item

The underline should:

* Match the width of the label rather than the whole navigation slot
* Use `#A83E52`
* Have a small rounded radius
* Sit approximately 6–8px below the text

Do not create a large tab or pill background.

The selected state should remain elegant and minimal.

Example:

Home    Our Memories    Continue Watching    Favorites
────────────
muted rose

````

---

# HOVER STATE

For inactive navigation items in Light Mode:

Default:

`#625C5E`

Hover:

`#211E1F`

or:

**Text / Primary**

Do not turn hovered inactive links into the active accent color.

This keeps active navigation visually distinct.

---

# FOCUS STATE

Keyboard navigation must remain visible.

For focused navigation items:

- Keep the appropriate text color
- Add a subtle AngelFlix accent focus indicator
- Do not rely only on color
- Do not use the browser's default bright-blue focus styling

Use a subtle outline or focus ring consistent with the existing design.

---

# NAVIGATION STATE MATRIX

Implement these Light Mode states consistently:

### Inactive

Text:
`#625C5E`

Weight:
Regular / Medium

No underline.

### Hover

Text:
`#211E1F`

Weight:
Medium

No active underline.

### Active

Text:
`#A83E52`

Weight:
Semibold

2px muted rose underline.

### Active + Hover

Keep:

`#A83E52`

Do not change it to another unrelated color.

### Focus

Maintain current active/inactive color while adding a visible accessibility focus treatment.

---

# OTHER NAVBAR ELEMENTS

Also verify the rest of the navbar in Light Mode.

## TV Home

The:

`← TV Home`

control should use:

Default:
`#6C6567`

Hover:
`#211E1F`

Do not make it compete visually with ANGELFLIX.

---

## ANGELFLIX Logo

Keep:

**ANGELFLIX**

in:

`#211E1F`

or the existing Light Mode logo token.

It should remain one of the strongest text elements in the navbar.

---

## “Our Private Cinema”

Use:

`#8E8788`

This should remain secondary to the ANGELFLIX wordmark.

---

## Search Icon

Default:

`#625C5E`

Hover:

`#211E1F`

Focused:

AngelFlix accent.

---

## App/Grid Icon

Use the same behavior as the Search icon.

Do not leave the icon too faint.

---

## Angel Avatar

Keep the existing muted rose avatar treatment.

Ensure:

- It has sufficient contrast against the Light Mode navbar
- Hover/focus state is visible
- It does not change dramatically between pages

---

# USE SEMANTIC VARIABLES

Do not hardcode the navigation colors separately on every frame.

Create or update variables such as:

`Nav / Background`

`Nav / Border`

`Nav / Text Default`

`Nav / Text Hover`

`Nav / Text Active`

`Nav / Focus`

For Light Mode:

```text
Nav / Background
#F7F4F1

Nav / Border
#E4DEDA

Nav / Text Default
#625C5E

Nav / Text Hover
#211E1F

Nav / Text Active
#A83E52

Nav / Focus
#A83E52
````

Map these semantic variables to the existing Light Mode variable system where possible.

Do not create duplicate theme systems.

---

# DARK MODE

Do NOT accidentally change the established Dark Mode navigation.

Dark Mode should continue using its existing readable values.

The active-page treatment can follow the same structural behavior:

* Active accent
* Slight font-weight difference
* Small underline

but preserve the existing Dark Mode colors.

Do not replace Dark Mode with the Light Mode palette.

---

# IMPORTANT — HERO OVERLAY NAVBAR

If the navbar appears over a dark photographic hero on the AngelFlix Home page, it may still need an inverse/overlay navigation style.

Do not force dark Light Mode text over a dark hero photograph.

Support two navbar contexts:

### Standard Light Navbar

For pages such as:

Our Memories
Favorites
Continue Watching
Search

Use:

Warm light background + dark readable text.

### Hero Overlay Navbar

When positioned directly over a dark hero photograph:

Use light/inverse text when needed for readability.

This is a **contextual navbar state**, not the same as Light/Dark theme.

Do not confuse:

`Light Theme`

with:

`Light Text Over Image`

Create or reuse an appropriate navbar variant for this.

---

# FIX THE CURRENT SCREENS

After updating the component, verify these exact screens:

### Our Memories — Light Mode

“Our Memories” must be clearly active using the muted rose treatment.

### Favorites — Light Mode

“Favorites” must be clearly active using the same treatment.

### Continue Watching — Light Mode

“Continue Watching” should receive the active treatment.

### Home — Light Mode

“Home” should receive the active treatment when the user is on the homepage.

Inactive items must remain consistently readable.

---

# CONTRAST CHECK

Verify that all navigation text has appropriate contrast against the navbar background.

There should be **no white navigation text on the warm Light Mode navbar**, except when intentionally using an inverse navbar over a dark hero image.

Pay particular attention to:

* Active links
* Inactive links
* Hover states
* Search icon
* TV Home
* “Our Private Cinema”
* Profile controls

---

# DO NOT

Do NOT:

* Redesign the navbar structure
* Change its height unnecessarily
* Move navigation items
* Change the ANGELFLIX branding
* Make active items white
* Add giant pill backgrounds
* Add large colored boxes around selected links
* Use bright Netflix red
* Use generic blue links
* Add heavy shadows
* Make the navbar taller
* Fix every page independently
* Break Dark Mode
* Change the current page layout

---

# EXPECTED FINAL RESULT

The Light Mode navbar should look approximately like:

```text
← TV Home     ANGELFLIX  Our Private Cinema

                         Home    Our Memories    Continue Watching    Favorites
                                 ────────────
                                 ACTIVE ROSE
```

On Favorites:

```text
Home    Our Memories    Continue Watching    Favorites
                                            ─────────
                                            ACTIVE ROSE
```

The navbar should feel:

* Clean
* Premium
* Minimal
* Warm
* Clearly readable
* Consistent with AngelFlix
* Accessible

Most importantly:

**Fix the shared Light Mode navigation active state so no active navigation label ever becomes white/invisible against the light navbar background.**
