# Weekly Study Planner — Plan for Version One

## What the product is

A Persian, right-to-left weekly study planner for exam candidates. The week grid is the product: a student picks a week from the Jalali calendar, fills day/time-slot cells with study activities, ticks them off as done, watches planned hours and completion percentage update, and can print or download the week as a PDF.

Everything stays on the student's own device (saved in the browser), single user, no login. Rebuild the prototype's features faithfully, with a much better look, clearer information hierarchy, and proper behaviour on phone and tablet.

## What the prototype already does (all preserved)

- RTL Persian interface, Persian digits, Vazirmatn typeface
- 7-day week grid with 10 configurable time slots; slot titles renamed by clicking them
- Jalali calendar to pick a date; the grid follows the week (Saturday–Friday) of that date
- Add an activity to a chosen day + slot with subject, topic, duration in minutes, description/test count, and a colour
- Edit and delete an activity; mark it done
- Reusable tiles library: create tiles (subject, topic, duration, colour), delete them, drag a tile into any cell
- Student name and week label
- Header stats: planned hours, completion percentage, activity count
- Motivational quote banner with a random quote; upload a plain-text file to replace the quote list
- "Clear week" and PDF download of the plan

## Product structure

One main screen, no navigation maze:

```text
Header      name + week label, stats (hours / done % / activities), actions
Quote strip one motivational line
Week grid   7 day columns x time-slot rows, colour-coded activity cards
Tiles rail  ready-made tiles to drag in + form to create one
Editor      add/edit activity panel (side panel on desktop, sheet on mobile)
Calendar    Jalali month picker for choosing the week
```

Responsive behaviour: desktop keeps the three-area layout; tablet collapses the side areas into slide-over panels; phone switches the grid to a single-day view with a day strip at the top, since a 7-column grid is unusable at that width. Drag-and-drop stays on desktop; on touch, tapping a tile then tapping a cell places it.

## UX improvements recommended

- Tap an empty cell to add an activity there directly, with the day and slot pre-filled, instead of choosing them in a form
- Activity cards show subject, topic, duration and a done state clearly, with colour used as a quiet accent rather than a full fill
- Per-day totals under each column, plus a subject-level breakdown of the week so a student can see imbalance at a glance
- Undo after delete and after clearing the week, and a confirmation before clearing
- Clearer empty states: an empty week explains how to start
- Colours get meaning (study / review / test / memorise / rest) with a legend, instead of being an anonymous swatch row
- Keyboard and screen-reader support on the grid and the panels
- Weeks are remembered separately, so moving to another week keeps each week's plan instead of overwriting one shared plan
- Light and dark theme

## Data model

Same simple shape as the prototype, with three changes worth making:

- Activities are keyed by week, so `weekStart` (the Saturday, stored as a plain date) joins day index, slot index, subject, topic, duration, details, category/colour, and done flag. Today's prototype has a single global task list, which silently overwrites the plan when the week changes.
- Slot titles carry an optional start and end time, so hours can be derived and displayed properly while still allowing free-text names.
- Settings (student name, slot titles, tiles, quotes, theme) are separated from week data, so clearing a week never touches the library or preferences.

Stored data is versioned, and existing prototype data in the browser is migrated into the new shape on first load rather than dropped.

## Technical approach

- The project runs on React with TypeScript, TanStack Router and Tailwind, which is the stack this environment is fixed to; Next.js is not available here, but the structure, component model and styling approach are the same in practice.
- No backend, no database: one small storage module wraps the browser store, and one typed state store holds the plan. This keeps the whole app readable and easy to learn from.
- Design tokens (colours, radii, shadows) defined centrally; components built on the bundled component library, with a small set of purpose-built pieces: week grid, activity card, tile, editor panel, Jalali calendar.
- Jalali date handling moved into one tested utility module (`toJalali`, `fromJalali`, week start, Persian digits, month lengths), rather than inline in the page.
- PDF: print-optimised stylesheet plus a client-side capture of the grid, loaded only when the button is pressed so it never slows the app down.
- Files roughly: `lib/jalali.ts`, `lib/storage.ts`, `lib/planner-store.ts`, `components/planner/*`, one route for the planner.

## Risks

- Jalali conversion and leap years must be right; covered with unit tests.
- PDF of a wide RTL grid can clip; handled with a dedicated print layout rather than a screenshot of the screen layout.
- Browser-only storage means data is lost if the student clears their browser or switches device; a JSON export/import gives them a way to keep a backup. Accounts can be added later without reshaping the model.

## First version scope

1. Design tokens, typography, RTL shell, light/dark theme
2. Jalali utilities + calendar week picker
3. Storage, migration from existing prototype data, planner state
4. Week grid with cells, activity cards, done toggle, per-day totals
5. Add/edit/delete activity panel, cell-click quick add
6. Tiles library: create, delete, drag on desktop, tap-to-place on touch
7. Stats, subject breakdown, quote strip with text-file upload
8. Clear week with undo, JSON export/import
9. PDF/print output
10. Responsive passes for tablet and phone, accessibility pass

## Questions before I build

1. Time slots: keep them as free-text "Hour 1…10", or give each slot a real start/end time so hours are computed automatically? Should the number of slots be adjustable?
2. Activity categories: is study / review / test / memorise / rest the right fixed set for colours, or do you want to define your own labels?
3. Should past weeks stay browsable as history, or does the app only ever show the selected week with no archive view?
4. Visual direction: pick a calm palette and typeface yourself, or do you want to see a couple of design options first?
