# Design System Document: The Stadium Pulse

## 1. Overview & Creative North Star: "The Stadium Pulse"
This design system is built to capture the kinetic energy of the 2026 FIFA World Cup while maintaining the sophisticated weight of a high-end editorial magazine. We are moving away from the "app-as-a-utility" look and toward "app-as-an-event."

**The Creative North Star: The Stadium Pulse.** 
The UI should feel like it is breathing. We achieve this through **intentional asymmetry**, where elements like player stats or team flags might break the boundaries of their containers. We favor **tonal depth** over structural lines, creating a layout that feels like a series of layered tickets, pitches, and screens rather than a flat grid. This is about the tension between the "Forest Green" of the pitch and the "Intense Red" of the passion in the stands.

---

## 2. Colors: Tonal Depth & The Kinetic Palette
Our palette is rooted in the vibrant colors of the tournament, but we must use them with surgical precision to avoid a "toy-like" appearance.

### The "No-Line" Rule
**Designers are prohibited from using 1px solid borders to section content.** 
Boundaries must be defined through background color shifts. For example, a card (`surface-container-lowest`) should sit on a section background of `surface-container-low`. This creates a soft, sophisticated transition that feels organic.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **Base:** `surface` (#f9f9f9).
*   **Secondary Sections:** `surface-container-low` (#f3f3f3).
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) to provide "pop" and clarity.
*   **Overlays/Modals:** Use `surface-container-highest` (#e2e2e2) with a 20% opacity reduction to allow the vibrant primary colors to bleed through from beneath.

### The "Glass & Gradient" Rule
To elevate the experience, use **Glassmorphism** for floating elements (like a "Make Prediction" FAB). Apply a backdrop-blur of 12px to a semi-transparent `surface` color. 
**Signature Gradients:** Use a linear gradient (135°) transitioning from `primary` (#3c0007) to `primary_container` (#630012) for hero actions. This adds a "soul" and depth that flat hex codes cannot achieve.

---

## 3. Typography: Bold Authority
We pair **Lexend** for headlines to provide a modern, athletic punch, with **Plus Jakarta Sans** for body copy to ensure editorial readability.

*   **Display & Headline (Lexend):** Use these for "Match Days" and "Scores." The `display-lg` (3.5rem) should be used sparingly for "hero" moments, like a winning prediction celebration.
*   **Title & Body (Plus Jakarta Sans):** These levels handle the heavy lifting. Use `title-lg` for team names. Ensure `body-md` has a line-height of at least 1.5 to maintain the "premium magazine" feel.
*   **Labels (Lexend):** All metadata (e.g., "LIVE," "90+4'") must use `label-md` in all caps with a 0.05em letter spacing to mimic professional sports broadcasting graphics.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to hide poor layout; we use them to simulate natural light.

*   **The Layering Principle:** Stack `surface-container` tiers. A match card prediction input should be `surface-container-lowest` placed inside a `surface-container-low` parent.
*   **Ambient Shadows:** For "floating" match details, use a shadow with a 24px blur and 4% opacity, tinted with the `on_surface` color (#1a1c1c). It should look like a soft glow, not a dark smudge.
*   **The "Ghost Border":** If a separation is strictly required for accessibility (e.g., in a high-density ranking table), use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Modern Sports Utility

### Match Prediction Cards
*   **Structure:** No borders. Use `surface-container-low` as the base.
*   **The "Winning" Glow:** When a team is selected, the team’s half of the card should transition to a subtle gradient of `secondary_container` (#9ff4c9) to signify the "Forest Green" of the pitch.
*   **Spacing:** Use "xl" (0.75rem) roundedness to keep the cards feeling modern and friendly.

### Ranking Tables & Standings
*   **Row Separation:** Forbid divider lines. Use alternating background shifts between `surface` and `surface-container-low`.
*   **Typography:** The user’s rank should use `headline-sm` in `tertiary` (#091445) to stand out with authority.

### Buttons
*   **Primary:** Gradient from `primary` to `primary_container` with `on_primary` (#ffffff) text. Use `full` (9999px) roundedness for a dynamic, "pill" look.
*   **Secondary:** `secondary` (#096c4b) text on a `secondary_container` (#9ff4c9) background. No border.

### Input Fields (Predictions)
*   **Style:** Minimalist. Use a `surface-container-highest` bottom bar (2px) that transforms into `primary` (#3c0007) on focus. Avoid boxed inputs; they feel too "form-heavy" for a vibrant sports app.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Allow team logos to slightly overlap the edge of a card to create a sense of movement.
*   **Embrace Negative Space:** High-end design requires room to breathe. Use the `surface` color to separate major sections, not lines.
*   **Color as Information:** Use `secondary` (Green) strictly for "correct" predictions and `primary` (Red) for high-stakes, "must-play" matches.

### Don't:
*   **Don't Use Pure Black:** Always use `on_surface` (#1a1c1c) for text to maintain a premium, softer contrast.
*   **Don't Use 1px Borders:** This is the quickest way to make the design look like a generic template. Refer back to Tonal Layering.
*   **Don't Over-Round:** Stick to the roundedness scale. Do not use `full` roundedness for square-content cards; keep those at `xl` (0.75rem) to maintain an architectural feel.