# Design and interaction

Follow NORTH_STAR.md for audience and direction. The shared design lives in src/app.css.

- Default to light surfaces with readable contrast. Maintain dark mode.
- Keep the Kaspa mark visible in the header.
- Use type, alignment, and spacing before adding borders or containers.
- Keep related controls, diagrams, and results together.
- Give interactive objects a clear shape and depth. Keep lighting and shadows consistent in both themes.
- Reserve translucent glass for navigation. Keep diagram objects opaque. Connection lines must not show through block faces or cross their labels.
- Choose the layout around the explanation, not the existing component arrangement.
- Use green for meaningful emphasis, not ambient decoration.
- Explain with labels at the object. Do not shrink important labels below 12px.
- Keep body text at least 16px and primary controls at least 44px.
- Preserve a useful complete demo state before interaction.
- Timed explanations stop, can be paused or replayed, and respect reduced motion.
- Qualitative illustrations carry no invented quantitative output.
- Name optional depth. Keep essential limitations visible.
- At 390, 768, and 1280px, recompose comparisons and avoid page overflow.
- Preserve visible focus, contrast, readable diagrams, and usability with enlarged text. Choose validation for the affected surface using MAINTENANCE.md.

Use plain HTML, CSS, and SVG for these diagrams. Add a library only when a specific capability justifies its weight. Existing primary sources and suitable open-source work inform the implementation; do not copy proprietary assets or imply affiliation.
