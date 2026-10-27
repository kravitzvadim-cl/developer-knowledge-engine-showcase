---
name: Docs Answer Engine
description: Cited answers drawn as a subway route; every claim stops at its source.
colors:
  ground: "#f4f4f1"
  panel: "#ffffff"
  ink: "#111111"
  muted: "#4f4f4a"
  hair: "#d9d9d2"
  rail: "#b9b9b1"
  band: "#111111"
  band-ink: "#f4f4f1"
  stripe: "#fccc0a"
  code-bg: "#e9e9e3"
  line-red: "#ee352e"
  line-blue: "#0039a6"
  line-green: "#00933c"
  line-orange: "#ff6319"
  error: "#b3261e"
  error-soft: "#fbe9e7"
  confidence-high: "#00833a"
  confidence-caution: "#b25400"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(32px, 4.4vw, 48px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(22px, 2.4vw, 28px)"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.35
  body-answer:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "tnum"
  label:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.08em"
  mono:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, Menlo, monospace"
    fontSize: "0.86em"
    lineHeight: 1.6
rounded:
  code: "4px"
  row: "8px"
  sheet: "16px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "16px"
  lg: "22px"
  xl: "32px"
  xxl: "56px"
components:
  top-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-ink}"
    padding: "16px 32px 22px"
  button-ask:
    backgroundColor: "{colors.band}"
    textColor: "#ffffff"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0 26px"
    height: "54px"
  button-ask-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  input-composer:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "54px"
  route-bullet:
    backgroundColor: "{colors.line-red}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    size: "36px"
  route-bullet-light-line:
    backgroundColor: "{colors.stripe}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "36px"
  trip-row:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "16px 8px"
  trip-row-hover:
    backgroundColor: "{colors.panel}"
  legend-line:
    rounded: "{rounded.row}"
    padding: "6px 8px"
  legend-line-active:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.row}"
  no-service-head:
    backgroundColor: "{colors.stripe}"
    textColor: "{colors.ink}"
    padding: "14px 20px"
  station-sign:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-ink}"
    padding: "22px 24px 32px"
---

# Design System: Docs Answer Engine

## Overview

**Creative North Star: "The Station Sign"**

The system is 1970s subway signage applied to retrieval. An answer is drawn as a route: each sentence is a stop on a vertical trunk, each retrieved source is its own coloured line with a numbered bullet, and a claim backed by several sources becomes a transfer station. The source passage is set on a black station sign beside the route (a bottom sheet on phones). Nothing is a chat bubble; the transcript reads as a sequence of destination boards and routes.

Material is flat paint on enamel: an off-white platform ground, signage-black bands, a single yellow edge stripe, and five saturated line colours that do the identifying work. Type is one grotesk (Archivo) set heavy and tight like station lettering, with tabular numerals throughout so scores, costs and latencies line up. Density is calm: one 780px column of route, generous stop spacing, heavy 3px rules framing each board.

Motion has one grammar: things arrive along the line. The route draws top to bottom on answer, bullets pop in at their stops in sequence, the station sign slides in, and the loading state is a running dashed track. All of it is gated behind `prefers-reduced-motion: no-preference`.

**Key Characteristics:**
- Black band with a yellow edge stripe as the frame of every sign (top band, station sign head).
- Five route colours keyed to source number, never to meaning.
- Circles and pills only; the rectangle is reserved for boards and code.
- Heavy rules (3px ink) top and bottom of lists and boards; 1px hairlines between rows.
- One sans family, heavy display weights, tracked uppercase only for short metadata labels.
- Light and dark schemes follow `prefers-color-scheme`; the band, stripe and line colours stay fixed.

## Colors

A neutral platform (off-white ground, signage black) carrying one yellow stripe and five fixed route colours that identify sources.

### Primary
- **Signage Black** (band): the top band, the station sign, the Ask button, and the 3px rules (the `rule` token equals ink). In dark scheme the band drops to pure black.
- **Service Yellow** (stripe): the 6px inset edge stripe under the top band, the 4px stripe under the station sign head, the focus ring, text selection, the "No service" board, and the source link on the black sign. It is also route line 4.

### Secondary: Route Lines
Assigned by source number, cycling: 1 **Route Red** (line-red), 2 **Route Blue** (line-blue), 3 **Route Green** (line-green), 4 **Service Yellow** (stripe), 5 **Route Orange** (line-orange). Red, blue and green carry white numerals; yellow and orange carry ink numerals. Route Blue also fills the "D" monogram in the band and the favicon. Route Green is the live-status dot in the band.

### Tertiary: Status
- **Confidence Green** (confidence-high) and **Caution Amber** (confidence-caution): the confidence value in the answer meta row only; dark scheme lifts them to #4cc27b and #ffa45c.
- **Fault Red** (error) on **Fault Wash** (error-soft): the "Answer not delivered" notice and its pill retry button.

### Neutral
- **Platform** (ground): page ground and composer bar; also the knockout behind bullets and route stop dots.
- **Enamel White** (panel): hover and active fill for trip rows and legend lines, composer input fill.
- **Ink** (ink): text and heavy rules.
- **Weathered Grey** (muted): lede, labels, unused legend entries, loading copy.
- **Hairline** (hair): 1px dividers between rows, the composer top border, the legend top border.
- **Rail Grey** (rail): the trunk before the first cited stop, the loading track, scrollbar thumb.
- **Code Slab** (code-bg): inline code in answer text.

### Named Rules
**The Line Is Identity Rule.** Route colours mean "source n", nothing else. Never use them for status, emphasis or decoration; confidence and errors have their own colours.

**The One Stripe Rule.** Yellow appears as a stripe, a ring, or a service board. It never fills a button or large panel in the light scheme (the dark-scheme Ask button is the one sanctioned fill).

## Typography

**Display Font:** Archivo Variable (with Helvetica Neue, Helvetica, Arial)
**Body Font:** Archivo Variable
**Label/Mono Font:** JetBrains Mono Variable for code only

**Character:** A single grotesk pushed to 750-800 for anything that names a place (headline, question, brand, sign title), relaxed to 400 for running answer text. Tabular numerals are on globally.

### Hierarchy
- **Display** (800, clamp(32px, 4.4vw, 48px), 1.05, -0.025em): the directory headline only; 30px on phones.
- **Headline** (750, clamp(22px, 2.4vw, 28px), 1.2, -0.015em): the question as destination board, underlined by a 3px ink rule.
- **Title** (650, 18px, 1.35): trip questions in the directory. Sibling weights: brand name 750/22px, sign title 750/18px, "No service" 800/22px, legend line 600/15px.
- **Body-answer** (400, 18px, 1.6, max 66ch): stop text on the route; 17px on phones.
- **Body** (400, 16px, 1.6): base; lede at 17px muted (62ch); passage on the sign 15.5px/1.7.
- **Label** (700, 11.5-12px, 0.07-0.08em, uppercase): trip tags, legend source ("Hono docs", "Policy", "Not cited"), meta keys. Always trailing or inline beside its value, never stacked above a heading.

### Named Rules
**The Station Lettering Rule.** Names of places (questions, signs, boards) are set heavy and slightly tight; nothing that names a place goes below 600.

## Layout

Three-row app grid: top band, scrolling feed, composer pinned at the bottom. The feed is a single centred column (max 780px) padded 40px 32px 56px with 56px between trips. When a source is open on wide screens the body splits into the feed and a station sign column (minmax(340px, 460px)) that scrolls independently with a sticky head.

The route is a two-column grid per stop: a 96px node column with the trunk centred at 44px, then text. On phones the column narrows to 68px and the trunk sits at 30px.

Breakpoint 960px: band padding 14px 16px 20px and the tagline hides; status figures switch to short labels on one line; feed padding 28px 16px 40px; trip tags drop beneath their question; the station sign becomes a fixed bottom sheet (max 72vh) and does not auto-open.

Spacing rhythm is observed at 8, 14, 16, 22, 32 and 56px.

## Elevation & Depth

Flat. Depth is conveyed by paint: black bands against the off-white ground, the yellow inset stripe, and 3px ink rules. Shadows are used structurally as rings and stripes, not as lift.

### Shadow Vocabulary
- **Edge stripe** (`box-shadow: inset 0 -6px 0 var(--stripe)`; 4px on the sign head): the yellow edge of every black sign.
- **Selected bullet ring** (`box-shadow: 0 0 0 3px var(--ink)`; legend uses `0 0 0 2px var(--ground), 0 0 0 4px var(--ink)`): the active source.
- **Transfer frame** (`box-shadow: inset 0 0 0 3px var(--ink)`): the pill that groups bullets on a multi-source stop.
- **Focus ring** (`outline: 3px solid var(--stripe); outline-offset: 2px; box-shadow: 0 0 0 5px var(--band)`): yellow inside black, a signage stripe on any focused control.
- **Sheet** (`box-shadow: 0 -12px 40px rgb(0 0 0 / 28%)`): phone bottom sheet only, the one ambient shadow.

### Named Rules
**The Paint Not Lift Rule.** Separate planes with colour bands and rules. The only blurred shadow is the phone sheet over the platform.

## Shapes

Two silhouettes. Circles and pills belong to the line: route bullets, stop dots (22px ring of the line colour), the transfer pill, the logo, the composer input and Ask button, the retry button, the close button. Square-cornered rectangles belong to signage: the top band, the station sign, the "No service" board, the trip directory and question boards, framed by 3px ink rules. Small radii are utility only: 4px inline code, 8px code blocks and hovered legend rows, 16px top corners on the phone sheet.

The trunk is an 8px vertical bar; each stretch after a cited stop takes that stop's line colour until the next citation.

## Components

### Buttons
- **Shape:** full pill (999px), 54px high.
- **Primary (Ask):** signage black, white label 750/16px, padding 0 26px, trailing arrow drawn as a stroked SVG. In dark scheme it fills Service Yellow with ink text.
- **Hover / Focus:** nudges 2px right along the line; focus takes the yellow-in-black ring.
- **Disabled:** transparent with a 2px ink inset outline (the resting look before a question is typed).
- **Retry:** small error-red pill, white 650/14px.

### Inputs / Fields
- **Composer:** full pill, 54px high, enamel white fill, 2px ink border, 500/16px, placeholder #6e6e68.
- **Focus:** 3px yellow outline at 2px offset over the black ring.

### Navigation
- **Top band:** black with yellow edge stripe; Route Blue "D" monogram bullet (44px, 38px on phones), brand name 750/22px, grey tagline. Right side: live eval figures, each preceded by an 8px Route Green dot, bold white number, grey label; the whole group links to the eval table and underlines on hover.

### Route Bullet (signature)
A numbered circle in the source's line colour, 800 weight numeral at 46% of its size, with a 3px ground-coloured border so it knocks out the trunk. Sizes: 36px default, 40px in the directory, 30px inside a transfer, 28px in the legend, 44px on the sign head. Hollow variant (ground fill, line-coloured inset ring, ink numeral) marks retrieved-but-uncited sources. Clickable bullets scale 1.1 on hover.

### Answer Route (signature)
The question board (headline over a 3px rule), then the ordered route of stops, then the legend of lines (cited first, uncited hollow and muted) and a meta row of label/value pairs: Confidence, Time, Cost, Model. When a bullet is chosen, stops not citing it fade to 42% opacity.

### Station Sign
The source panel: black, sticky head with the 44px bullet, section title, "Exact passage given to the model", and a yellow link out, closed by a 36px circular X. Passage text is off-white 15.5px/1.7 with dark slab code blocks. Escape closes it.

### No Service Board
Refusals are a yellow board ("No service" 800/22px, "Not covered in the docs" 650/15px) between 3px ink rules, followed by the nearest stations as a legend.

### Directory
The empty state: display headline, muted lede, and five trips as rows between 3px rules with hairline dividers; each row is a 40px bullet, the question, and a trailing tracked tag. Hover fills enamel white and scales the bullet 1.12.

### Approaching
The loading state: an 8px dashed rail-grey track running downward beside muted copy naming what is being searched.

## Do's and Don'ts

### Do:
- **Do** assign route colours strictly by source number in the order red, blue, green, yellow, orange, with ink numerals on yellow and orange.
- **Do** frame signs with signage black plus a yellow inset edge stripe (6px on the band, 4px on sign heads).
- **Do** open and close boards and lists with 3px ink rules and divide rows with 1px hairlines.
- **Do** use the yellow-in-black focus ring (3px stripe outline, 5px band ring) on every interactive element.
- **Do** keep numerals tabular and show scores, cost and latency as plain label/value pairs.
- **Do** gate all route drawing, bullet arrival and sign motion behind `prefers-reduced-motion: no-preference`, easing on cubic-bezier(0.16, 1, 0.3, 1).

### Don't:
- **Don't** render answers as chat bubbles or a message transcript; an answer is a route of stops.
- **Don't** use route colours for status, success or emphasis; status uses the confidence and error tokens.
- **Don't** add drop shadows for lift; the phone sheet is the only blurred shadow.
- **Don't** introduce a second display family; Archivo carries everything except code.
- **Don't** stack tracked uppercase labels above headings; labels sit beside or after their value.
