# Tailwind Migration Plan

## Completed bootstrap

- Tailwind + PostCSS toolchain is installed and wired into CRA (`@tailwind` directives now power `src/index.css`).
- Custom design tokens that previously lived in `EquipmentList.css` are encoded in `tailwind.config.js` as `inventory` colors, radii, shadows, and font families so utilities can stay on-brand.
- Tailwind-driven screens so far: `Login`, `AdminPanel`, `EquipmentList`, `PersonnelModule`, `ProjectList`, `Dashboard`, `MainNavigation`, `Modal`, `Capacity`, `PlanningPage`, `OverviewDashboard`, and `NodeEditor`.

## Phase 1 - normalize shared primitives

1. **Centralize tokens**: move any remaining `:root` CSS variables into a shared file such as `src/styles/tokens.css`, re-express them with `@layer base`, and ensure every value lives in `tailwind.config.js`. This guarantees utilities like `bg-inventory-panel` stay single-sourced.
2. **Author reusable patterns**: create `@layer components` snippets for repeatable patterns (cards, panels, buttons) using `@apply`. Doing so lets legacy class names keep working while running on Tailwind primitives under the hood.
3. **Linting/formatting**: add optional ESLint rules (`eslint-plugin-tailwindcss`) once the codebase starts leaning on utilities; this prevents typos in long class lists.

## Phase 2 - incremental screen migration

1. **Pick low-risk screens first**: forms (`Login`, modal dialogs, single-column admin panels) are ideal because their CSS is smaller. Convert JSX markup to Tailwind utilities and delete the paired CSS file once parity is confirmed.
2. **For dense layouts**, prefer the bridge strategy:
   ```css
   @layer components {
     .inventory-topbar {
       @apply flex items-center justify-between rounded-inventory-lg bg-inventory-panel px-5 py-3 shadow-inventory;
     }
   }
   ```
   This keeps the existing class name while ensuring the visual recipe is defined through Tailwind tokens. Later, you can inline the resulting classes directly in JSX if desired.
3. **Document each win**: after migrating a component, note it inside this document so it is clear which CSS files can be deleted from `App.tsx`.

## Phase 3 - harden & remove legacy CSS

1. Once every `.css` import has either been deleted or rewritten with `@apply`, remove the legacy stylesheet from `App.tsx` and prune the file entirely.
2. Run `npm run build` (fixing the pre-existing `AuthUser.fullName` typing issue in `EquipmentList.tsx` first) and visual regression test the UI.
3. Optionally enable `tailwindcss-animate` or other plugins if you need richer interactions; they can now be dropped into `tailwind.config.js`.

## Migration checklist per component

- [ ] Snapshot / Storybook reference updated (screenshot or Percy).
- [ ] JSX uses Tailwind utilities or the component class is backed by `@apply`.
- [ ] Legacy CSS file deleted and its import removed from `App.tsx`.
- [ ] Keyboard focus states reviewed (Tailwind utilities make this trivial via `focus-visible:`).
- [ ] Component re-tested inside the protected routes to ensure auth wrappers still work.

Complete this checklist for each screen (`ProjectList`, `EquipmentList`, etc.) and the migration can proceed without large bang rewrites.
