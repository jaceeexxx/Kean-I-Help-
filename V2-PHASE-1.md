# Kean I Help? — V2 Phase 1
## Brand, Asset System & Responsive Shell

This is the first cumulative V2 restore point. It keeps the Phase 12 application logic and the Supabase email/password authentication patch, then adds the new V2 brand foundation.

### Included
- New `/public/assets` hierarchy.
- `K?` + peeking-Jace brand mark and PWA app icons.
- Game-emote-style Jace sticker family: default, thinking, explaining, proud, gentle, focus, celebrate, rest, confused, exam-done.
- Separate mini Jace assets for navigation/chat/message use.
- Custom navigation icons and the three CELE-area symbols.
- Empty-state illustration starter set.
- V2 design tokens for Kean Blue, Jace Yellow, Paper, dark mode, spacing, and radii.
- Responsive global shell: bottom navigation for compact layouts and a persistent desktop sidebar.
- Ask Jace is now entered through the Jace sticker rather than the old floating `J` FAB.
- Updated manifest/PWA icons.

### Art direction
The Jace art is intentionally illustrated rather than photorealistic: bold mobile-game/emote proportions, clean cel shading, dark outline, expressive poses, and simplified facial detail. It is derived from the user-provided reference photo but the original photo is **not included** in this ZIP.

### Device behavior
- Compact/mobile: top bar + bottom navigation with raised Jace sticker.
- Medium/tablet: compact shell remains until enough width exists for the sidebar; later feature phases add split-pane layouts.
- Desktop >= 900px: persistent 236px sidebar.
- Simulation/run screens continue to suppress normal app navigation.

### Routes in this phase
The existing `/exam` route is temporarily labeled **Practice** in navigation. The dedicated `/practice` route family will be introduced in V2 Phase 5 when the practice/simulation frontend is rebuilt.

### Next
V2 Phase 2: authentication gate, first-launch experience, onboarding, profile and settings redesign.
