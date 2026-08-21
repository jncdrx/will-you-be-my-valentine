Continue working on the **existing AngelFlix design currently open in Figma Make**.

The current AngelFlix design, screens, components, navigation, typography, layout, cards, video player, and visual hierarchy are already established.

**Do NOT redesign the application.**

Your task is to add a complete **Dark Mode + Light Mode theme system** to the existing AngelFlix interface while preserving its current cinematic and romantic identity.

The application should support:

* Dark Mode
* Light Mode
* System / Automatic theme
* Manual theme switching

Dark Mode should remain the **default visual identity** of AngelFlix because this is a private cinematic video experience.

Light Mode should feel intentionally designed for AngelFlix rather than looking like the dark design was simply inverted.

---

# PRIMARY RULE

Preserve the current AngelFlix design structure exactly.

Do not change:

* Page layouts
* Navigation structure
* Memory card structure
* Hero composition
* Typography hierarchy
* Video-player layout
* Existing spacing
* Existing component proportions
* Existing functionality
* Existing romantic/cinematic direction

Only adapt the visual tokens and necessary component states for dark and light themes.

---

# CREATE A PROPER THEME SYSTEM

Do not manually recolor every screen independently.

Create reusable **Figma Variables / Color Variables** with two modes:

### Dark

### Light

If Figma variables already exist, extend the existing variable collection instead of creating a duplicate system.

Create semantic color tokens rather than component-specific random colors.

Use tokens such as:

Background / Primary
Background / Secondary
Background / Elevated
Background / Overlay

Text / Primary
Text / Secondary
Text / Muted
Text / Inverse

Border / Default
Border / Subtle
Border / Strong

Accent / Primary
Accent / Primary Hover
Accent / Primary Pressed
Accent / Warm

Button / Primary Background
Button / Primary Text
Button / Secondary Background
Button / Secondary Text

Card / Background
Card / Hover
Card / Focus

Progress / Played
Progress / Remaining

Navigation / Background

Input / Background
Input / Border
Input / Placeholder

Player / Controls Background

Do not use raw colors directly throughout individual components when a semantic variable can be used.

---

# DARK MODE

Preserve the current AngelFlix dark cinematic appearance.

Use the existing values wherever possible.

Recommended direction if variables have not yet been established:

### Background / Primary

`#09090B`

### Background / Secondary

`#111113`

### Background / Elevated

`#18181B`

### Background / Overlay

Black with appropriate opacity

### Text / Primary

`#F8F5F2`

### Text / Secondary

`#B8B1AE`

### Text / Muted

`#858080`

### Border / Default

`#29272A`

### Border / Subtle

White at approximately 8–12% opacity

### Accent / Primary

Use the existing AngelFlix muted rose accent.

Approximately:

`#B7475A`

### Accent / Primary Hover

Slightly lighter:

`#C75A6B`

### Accent / Primary Pressed

Slightly darker:

`#973A49`

### Accent / Warm

Approximately:

`#D9B38C`

Do not introduce Netflix red.

Do not increase saturation unnecessarily.

Dark Mode should remain:

* Cinematic
* Intimate
* Warm
* Premium
* Low-glare
* Comfortable for nighttime video viewing

---

# LIGHT MODE

Create a completely intentional light version of AngelFlix.

Do NOT use:

* Pure white everywhere
* Harsh black text
* Bright pink
* Generic blue links
* Strong gray borders
* Cold corporate styling

The light theme should feel like a **warm editorial photo album mixed with a premium cinema interface**.

Recommended palette:

### Background / Primary

Warm off-white:

`#F7F4F1`

### Background / Secondary

`#EEE9E5`

### Background / Elevated

`#FFFFFF`

### Text / Primary

Deep warm charcoal:

`#211E1F`

### Text / Secondary

`#655E60`

### Text / Muted

`#8E8788`

### Border / Default

`#DDD6D2`

### Border / Subtle

`#E8E2DE`

### Accent / Primary

Keep the AngelFlix muted rose identity:

`#A83E52`

### Accent / Primary Hover

`#923246`

### Accent / Primary Pressed

`#7D293A`

### Accent / Warm

`#A97B55`

The light theme should visually communicate:

**AngelFlix during the daytime**

while Dark Mode communicates:

**AngelFlix movie night**

Both themes must clearly belong to the same product.

---

# IMPORTANT — KEEP THE BRAND CONSISTENT

ANGELFLIX must retain the same:

* Logo
* Wordmark
* Typography
* Brand spacing
* General accent identity

Do not create separate branding for Light Mode.

You may slightly adjust logo color only for contrast.

For example:

Dark Mode:

ANGELFLIX in warm white or existing accent.

Light Mode:

ANGELFLIX in deep charcoal or muted rose.

Do not alter the shape or composition of the logo.

---

# THEME SWITCHER

Add a theme control to the AngelFlix interface.

Preferred location:

Inside the **Angel profile dropdown**.

Current profile menu may contain:

Angel
Our Cinema

TV Home
Letters
AngelFlix Home

Divider

Theme

Sign Out

Under **Theme**, provide:

### System

### Light

### Dark

Use professional icons such as:

* Monitor / system
* Sun
* Moon

Do not use emoji characters.

Use the existing icon style.

---

# OPTIONAL QUICK THEME CONTROL

If appropriate for the current design, also add a small theme icon in the profile menu header.

Do NOT clutter the main navigation with a large theme toggle unless necessary.

The primary place for theme selection should remain the profile menu.

---

# THEME SWITCHER COMPONENT

Create a reusable component:

**Theme Selector**

Variants:

System
Light
Dark

States:

Default
Hover
Focused
Selected

The selected state should be subtle but obvious.

Use:

* Accent check indicator
* Slight background difference
* Clear text hierarchy

Do not use a giant toggle switch for three modes.

---

# SYSTEM MODE

Add a concept for:

**System**

System follows the device or browser theme preference.

In the Figma prototype, treat this as a selectable state.

For development later, System should correspond to:

`prefers-color-scheme`

Do not visually force System to look like either Light or Dark in the selector.

Show a monitor/system icon.

---

# CREATE THEME VARIANTS OF EXISTING SCREENS

Do not duplicate every page unnecessarily.

Use Figma variable modes to demonstrate the theme change wherever possible.

However, create side-by-side example frames for these important screens:

### 1. AngelFlix Home — Dark

### 2. AngelFlix Home — Light

### 3. Our Memories — Dark

### 4. Our Memories — Light

### 5. Memory Details — Dark

### 6. Memory Details — Light

### 7. Profile Menu with Theme Selector

These examples should clearly demonstrate how the system behaves.

Do not manually rebuild all seven.

Reuse existing components and switch their variable mode.

---

# ANGELFLIX HOME — LIGHT MODE

The homepage hero should remain cinematic.

Do NOT remove its dark image overlay simply because Light Mode is active.

The hero can remain naturally dark when the photograph requires it.

Light Mode primarily changes:

* Page background below the hero
* Navigation when scrolled
* Card text
* Metadata
* Surface backgrounds
* Buttons
* Borders
* Search UI
* Profile menus
* Empty states
* Supporting sections

This is important:

**Light Mode does not mean every photograph or video area becomes bright.**

The hero must still maintain readable text.

If hero text overlays a dark photograph, keep white hero text even in Light Mode.

Use semantic inverse text tokens for this.

---

# NAVIGATION THEMING

### Dark Mode

Navigation:

Near-black background when solid.

Text:

Warm white.

Secondary text:

Muted gray.

### Light Mode

When navigation is no longer over the hero:

Use:

Warm off-white or white.

Text:

Deep charcoal.

Use a subtle bottom border if necessary.

Do not add a strong drop shadow.

When the navbar overlays the hero:

Keep the transparent/dark-gradient cinematic treatment in both themes if necessary for readability.

---

# MEMORY CARDS

Memory thumbnails remain unchanged between themes.

Do not apply a color filter to personal photos merely because the theme changes.

### Dark Mode

Card surrounding surface:

Dark or transparent.

Text:

Warm white.

Metadata:

Muted light text.

### Light Mode

Card surface:

White or warm-light surface.

Text:

Deep charcoal.

Metadata:

Warm gray.

Use very subtle shadow or border.

Do not make light-mode cards look like generic ecommerce product cards.

Keep the visual focus on the photograph.

---

# CARD HOVER

Dark:

Slight elevation + accent focus ring.

Light:

Slight elevation + subtle shadow + accent focus ring.

Keep:

Approximately 1.03–1.05 scale.

Do not make Light Mode hover dramatically brighter.

---

# PROGRESS BARS

The AngelFlix progress accent should remain recognizable in both themes.

Played portion:

Muted rose accent.

Remaining portion:

Dark:
Muted dark gray.

Light:
Soft warm gray.

Ensure progress is visible but not visually dominant.

---

# BUTTON THEMING

Create semantic button variables.

## Primary Button — Dark

Background:

Warm white or current primary button color.

Text:

Dark.

## Primary Button — Light

Use either:

Deep charcoal background + warm white text

OR

AngelFlix muted rose background + white text

Choose whichever best preserves the existing button hierarchy.

Do not randomly swap button styles across pages.

---

# SECONDARY BUTTON

Dark Mode:

Dark translucent surface with light text.

Light Mode:

Warm-light elevated surface with dark text and subtle border.

Ensure both remain readable over photographic hero backgrounds.

Hero buttons may use inverse styling independent of global page mode.

---

# SEARCH

Dark:

Dark surface.

Light text.

Subtle dark border.

Light:

White/elevated surface.

Dark text.

Warm gray placeholder.

Soft border.

Search focus:

Use the AngelFlix accent.

Do not use browser-default blue focus styling.

---

# PROFILE DROPDOWN

Create both theme variants.

### Dark

Dark elevated surface.

Warm white text.

Subtle border.

### Light

White/elevated surface.

Dark charcoal text.

Warm subtle border.

Keep the same:

* Size
* Radius
* Padding
* Spacing
* Icon placement

Only semantic colors should change.

---

# EMPTY STATES

Light Mode empty states should NOT become overly cheerful or childish.

Keep:

* Minimal line illustrations
* Warm neutral tones
* Muted rose accent
* Plenty of whitespace

Dark Mode:

Use subdued outlines.

Light Mode:

Use warm-gray outlines.

Do not introduce colorful illustrations just for the light theme.

---

# VIDEO PLAYER

IMPORTANT:

The actual **video player remains dark in BOTH themes.**

Watching a video should always prioritize the media.

Keep:

Near-black video background.

Dark player controls.

White/light controls.

AngelFlix accent progress.

Do not create a white video-player background.

Light Mode applies to:

* Details pages
* Browsing
* Navigation
* Menus
* Search
* Cards

It should not compromise cinematic playback.

---

# MEMORY DETAILS PAGE

The large photographic hero should remain visually cinematic in both themes.

For content below the hero:

### Dark Mode

Near-black background.

Warm white typography.

### Light Mode

Warm off-white background.

Dark typography.

The transition from the dark photographic hero to the light content area should be smooth.

Use a subtle gradient or clear visual separation.

Do not create an abrupt ugly white rectangle immediately after the hero.

---

# FAVORITES

Favorite hearts should retain the muted AngelFlix rose accent in both themes.

Do not make them bright red in Light Mode.

---

# ACCESSIBILITY

Verify contrast for both themes.

Text must maintain at least appropriate WCAG contrast where applicable.

Especially check:

* Secondary text
* Card metadata
* Buttons
* Input placeholders
* Focus rings
* Progress bars
* Navigation
* Profile menu
* Filters

Do not use extremely faint gray text in Light Mode.

Do not use near-black secondary text in Dark Mode.

---

# FOCUS STATES

Keyboard focus must remain visible in both modes.

Use the AngelFlix accent color.

Light Mode may require a slightly darker accent focus ring.

Dark Mode may require a slightly brighter accent focus ring.

Do not rely only on shadow for focus.

---

# IMAGE OVERLAYS

Keep overlays independent from the general theme when required.

For example:

Hero image:

Dark gradient remains even in Light Mode.

Card hover overlay:

Dark translucent gradient remains because white text must stay readable over thumbnails.

Do not turn overlays white in Light Mode.

Photographic readability takes priority over global theme colors.

---

# THEME PROTOTYPE INTERACTION

In Figma Make, prototype the theme selector.

Selecting:

**Dark**

should show the Dark variable mode.

Selecting:

**Light**

should show the Light variable mode.

Selecting:

**System**

should conceptually represent automatic device preference.

If Figma Make cannot dynamically read the operating system theme, create a representative prototype interaction demonstrating the expected behavior.

Do not create fake complex logic merely to simulate an operating system.

---

# THEME PERSISTENCE — DEVELOPMENT INTENT

This design will later be integrated into code.

Structure the theme design so implementation can support:

* `light`
* `dark`
* `system`

The selected preference should eventually persist between sessions.

Do not visually depend on page-specific theme settings.

One application-level theme should control all AngelFlix browsing screens.

---

# TRANSITION BETWEEN THEMES

Theme switching should feel smooth but quick.

Design intent:

Approximately 150–250ms color transition.

Do not animate:

* Video thumbnails
* Hero photography
* Layout positions
* Card sizes

Only transition appropriate properties such as:

* Background
* Text
* Border
* Surface
* Icon color

Avoid a large flash of white or black during switching.

---

# MOBILE THEME SUPPORT

The existing mobile version should support the exact same:

System
Light
Dark

theme options.

Do not create a separate mobile color system.

Reuse the same semantic variables.

The profile menu remains the preferred location for theme selection.

Ensure:

* Light-mode bottom navigation is readable
* Dark-mode bottom navigation remains low-glare
* Theme selector touch targets are at least approximately 44px
* Mobile video player stays dark

---

# THEME COMPONENT CHECKLIST

Make sure these components all respond correctly to theme variables:

* Navigation
* ANGELFLIX branding
* Primary button
* Secondary button
* Icon buttons
* Memory cards
* Metadata
* Filters
* Search
* Search results
* Continue Watching
* Progress bars
* Favorites
* Details content
* Profile menu
* Theme selector
* Empty states
* Error states
* Loading skeletons
* Bottom mobile navigation

Video-player media area remains intentionally dark.

---

# LIGHT MODE LOADING SKELETONS

Do not use dark skeleton blocks on a bright background.

Create theme-aware skeleton variables.

Dark:

Dark elevated gray.

Light:

Soft warm gray.

Keep skeleton animation subtle.

---

# LIGHT MODE ERROR STATES

Maintain the same calm AngelFlix tone.

Example:

**This memory couldn't play**

Do not turn errors bright red.

Use the accent color only for the icon or important action.

Error UI should remain visually integrated with the application.

---

# DO NOT

Do NOT:

* Redesign existing layouts
* Change AngelFlix branding
* Replace the muted rose accent with generic blue
* Use Netflix red
* Use pure `#FFFFFF` as the entire page background without warm treatment
* Use pure `#000000` text throughout Light Mode
* Invert photographs
* Brighten videos
* Make the video player white
* Create separate components just for every color mode
* Duplicate all components unnecessarily
* Hardcode theme colors individually
* Add a large floating sun/moon toggle over the interface
* Add emoji sun/moon icons
* Make Light Mode look like an admin dashboard
* Make Dark Mode excessively black with no visual depth

---

# FINAL VISUAL GOAL

Dark Mode should feel like:

**Our private movie night.**

Light Mode should feel like:

**Our memories during a quiet afternoon.**

Both should unmistakably feel like the same **AngelFlix** experience.

The final design system should support:

```text
AngelFlix
│
├── System Theme
│     └── follows device preference
│
├── Dark Mode
│     └── cinematic / nighttime
│
└── Light Mode
      └── warm / editorial / daytime
```

Keep **Dark Mode as the default AngelFlix presentation**, but make Light Mode equally polished and intentional.

Most importantly:

**Do not redesign the current AngelFlix experience. Add a proper theme system to what already exists.**
