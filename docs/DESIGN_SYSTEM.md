# Web design system

This document defines the shared visual language and UI component kit for the
Mesh Fire Detection site. The source of truth is the combination of this
document, the typed components in `src/components/shared/`, and the tokens in
`src/assets/styles/tokens/`.

## Design principles

- Use the shared components for recurring controls, typography, status, and
  layout. Compose page content from them instead of recreating their styles.
- Keep page-specific behavior and one-off compositions beside the page that
  owns them. Promote a pattern when it is reused or needs a stable shared API.
- Use semantic variants such as `fire`, `warn`, and `live` only for the meaning
  they express. Keep the fire color for primary actions and important emphasis.
- Keep visual values in tokens. Component and page styles may choose among
  tokens, but should not introduce their own colors, type scales, spacing
  scales, or radii.
- Keep states visible and consistent: hover, active, focus, disabled, loading,
  empty, warning, and error states should use the shared visual language.
- Preserve keyboard access, visible focus, accessible names, and status text.
  Color and animation alone must not carry meaning.

## Foundations

Tokens are declared in `src/assets/styles/tokens/` and loaded before all
component styles.

| Foundation        | Source       | Contract                                                                                                                                       |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Color and status  | `color.css`  | Dark surfaces; `text`, `muted`, and `faint` text; `fire` for primary emphasis; `live`, `warn`, and `dead` for state, with softer inline tones. |
| Typography        | `type.css`   | Sans and monospace families, with text sizes from `2xs` through `5xl`. Use monospace for measurements, identifiers, and compact labels.        |
| Spacing and shape | `space.css`  | The numbered `s_0`–`s_10` spacing scale and `sm`, `md`, `lg`, and full radii. Layout components accept the matching numbered scale.            |
| Layout            | `layout.css` | Site container widths and shared dimensions. Use `Container`, `Section`, and `Grid` for page structure.                                        |
| Motion            | `motion.css` | Shared easing and shadow values. Motion should remain brief and must respect reduced-motion preferences.                                       |

Do not add raw color, font-size, spacing, or radius values to component or page
CSS. Add or adjust a token first when a new value belongs to the shared visual
language. Keep CSS in the established layer order: tokens, base, components,
layout, sections, utilities.

## Shared component kit

Import components from their role-based modules under
`src/components/shared/`. Their TypeScript props define the supported choices;
do not add free-form visual values when a named variant can express the need.

### Layout and surfaces

`Container` sets the page width (`default`, `narrow`, or `wide`). `Section`
controls vertical rhythm (`none`, `sm`, `md`, `lg`), surface tone, border, and
optional grid background. Use `Stack`, `Row`, and `Grid` for composition;
`Box` provides a shared surface with token-based padding, tone, radius, border,
semantic accent, and an optional lift-on-hover treatment. `Divider`, `Spacer`,
and `ScrollArea` cover common layout details. `Canvas` is reserved for
third-party drawing surfaces such as MapLibre.

### Typography

Use `Heading` for headings and set its semantic `level` independently from its
visual `size`. `Eyebrow` labels a section. Use `Text` for body copy, labels, and
values, or the narrower `Value`, `Strong`, `Break`, and `CodeBlock` helpers where
appropriate. Text sizes, tones, weights, alignment, truncation, and monospace
styling are selected from typed options. The softer status tones are `liveSoft`,
`warnSoft`, and `deadSoft`. Use `Icon`'s tone option instead of adding a color
wrapper around an icon.

### Actions and navigation

Use `Button`, `ButtonLink`, or `ButtonAnchor` according to the action: local
action, internal route, or external/download link. They share these variants:
`primary`, `secondary`, `ghost`, `danger`, `bluetooth`, `usb`, and `contrast`;
sizes are `sm`, `md`, and `lg`. `TextLink` supports `link`, `quiet`, and `fire`
tones. `NavLink` handles active routes. Use `IconLink`, `BareButton`, and
`LinkCard` only for their documented icon-only, unstyled region, and whole-card
cases. `SkipLink` is the keyboard skip-to-content control.

### Fields

Use `TextField`, `PasswordField`, and `TextareaField` for text entry; `NumberField`,
`SelectField`, `FileField`, and `SliderField` for typed controls; `CheckboxField`,
`RadioGroup`, and `SegmentedField` for choices. `SearchField` adds a clear action.
Every field uses a visible label. Text, number, select, file, checkbox, and radio
fields support required state and inline errors; sliders expose their formatted
value and descriptions to assistive technology. `Form`, `FormSection`, and `FormActions` compose native submission
and groups. Keep field values controlled and validation in the owning feature.

### Status and data

`Badge`, `StatusDot`, and `StatusLabel` use the shared status kinds: `live`,
`warn`, `dead`, `fire`, and `neutral`. `Badge` has a compact `xs` size.
`Metric` presents a labeled value with a typed tone and size; `MetricCard` places
it on a shared surface. `CodeBlock` formats long preformatted payloads and
snippets. Use `Icon` with the closed `IconName` set so icon shape and
accessibility behavior stay consistent.

### Content and page patterns

Use `Callout`, `EmptyState`, and `ErrorState` for notices and collection/load
feedback; `SectionHead` for section introductions; `CollectionToolbar` for search
controls and result counts; `MetricGrid` for responsive metric arrangements;
`List`, `DescriptionList`, `StepList`, `Timeline`, and `DataTable` for their
corresponding semantic patterns. `SampleDataBanner` and `CostComparison` are
composed content widgets. Keep domain content in the owning page and content
module.

## Component and style changes

When adding a shared component:

1. Confirm that an existing component or a page-local composition cannot express
   the need clearly.
2. Place it under the existing shared role (`forms`, `primitives`,
   `typography`, `navigation`, `page`, or `widgets`) and give it a typed, finite visual API.
3. Put its styles in the matching file under `src/assets/styles/components/` and
   use existing tokens. Add a new token only when the value is part of the
   common system.
4. Keep domain-specific widgets in their owning feature or page. Cross-page
   build and network widgets follow the placements in `AGENTS.md`.
5. Update this inventory when a shared component, variant, token, or design
   decision changes.

Page styles may control page-specific composition and responsive layout. They
must use shared tokens and should not redefine the appearance of a shared
component. Prefer adding a named component variant when the same visual change
is needed in more than one place.

## Product UI roadmap

This section records what the kit supports now and which product pieces still
need a real workflow. Add components with their first consumer; avoid parallel
APIs and controls that the product does not use. Registration, node lists, and
management pages should extend the current visual language.

### Native elements and controlled appearance

The global JSX allowlist remains limited to neutral layout elements. Native
semantics are permitted only inside the shared component that owns them, with
its own lint exception and CSS reset. Pages compose the shared components.

Current native elements:

- `button` in `Pressable` and sortable table headings. Buttons have explicit
  types; their native disabled state and keyboard behavior are preserved.
- `a` in the internal and external navigation components.
- `input`, `textarea`, `select`, `option`, and `label` in field components.
- `form`, `fieldset`, and `legend` in the shared form components.
- `h1` through `h6` in `Heading`, chosen by semantic level and styled by kit
  size tokens.
- `table`, `caption`, `thead`, `tbody`, `tr`, `th`, and `td` in `DataTable`.
- `ul`, `ol`, `li`, `dl`, `dt`, and `dd` in list and timeline components.
- `pre` and `code` in `CodeBlock`.

Explicit component styles reset margins, padding, fonts, borders, backgrounds,
appearance, and sizing when those defaults would affect the kit. The resets
preserve browser behavior such as password managers, zoom, keyboard activation,
text selection, and textarea resizing. Focus remains visible. Avoid blanket
`all: unset` and global native-element exceptions.

### Product boundaries

- The backend currently supports email/password accounts created by invitation.
  Design invite acceptance and sign-in first. Public self-service registration,
  password recovery, and email verification need explicit product/API support
  before their screens are implemented.
- The public network feed and the administrative device list have different
  access and data contracts. A public node browser must use public fields;
  device management uses the authenticated admin API. Hiding a control is not
  authorization.
- UI kit components own presentation and interaction contracts. Authentication,
  API calls, permissions, node health thresholds, and alert evaluation belong
  to features and application services.
- Keep `NodeStatus`, `NodeSummary`, `BatteryIndicator`, `LastHeard`, and
  `NodeFilters` under the network feature. Compose them from shared components;
  do not teach the generic kit about node types or telemetry.

### Implemented UI kit capabilities

- Forms have shared text, email, password, search, textarea, number, select,
  file, slider, checkbox, radio, and segmented controls. Labels and help text
  use a readable sans-serif style; measurements and identifiers can use
  monospace. Errors connect to fields with `aria-describedby` and
  `aria-invalid`. Number inputs preserve an empty editing draft without sending
  `NaN` into page state.
- `Form` submits natively on Enter. `FormSection` groups related inputs, and
  `FormActions` aligns the actions. Buttons accept explicit type, disabled,
  toggle, and loading states. `IconButton` requires an accessible label.
- `DataTable` now renders a native table, supports sortable typed columns and
  accessible `aria-sort`, and provides a default empty message. The map's node
  list composes `SearchField`, a status select, a result count, an empty state,
  and local sorting. Search matches node name, ID, or type.
- `MetricGrid` uses a shared minimum-width token. `EmptyState` distinguishes an
  empty result from a failure. `ErrorState` supports an optional retry action;
  the map uses it when the browser cannot initialize the visualization.
- `Heading`, `List`, `DescriptionList`, `StepList`, `Timeline`, and `CodeBlock`
  use native heading, list, definition-list, and preformatted-code semantics.

### Deferred until their product flow exists

- The backend's account flow is invite-based. Build invite acceptance and sign-in
  when the web app has its API/session integration. Public self-registration,
  password recovery, and email verification need product and backend support.
- The map list currently uses the public sample dataset. Admin device management
  needs authenticated API integration and permission-aware feature UI. The kit
  does not define node health or telemetry rules.
- `Pagination` waits for an endpoint with a paging contract. The current node
  set does not need virtualization. Filter chips wait for workflows with several
  simultaneously applied filters; the current status filter is a select.
- `PageHeader` is not a second header API: `Page` and `SectionHead` already
  cover the page and section roles. `Button` with a label covers icon-only
  actions through the `IconButton` helper.
- Toasts, dialogs, menus, tabs, tooltips, drawers, comboboxes, date pickers, and
  charts wait for their first real interaction requirement. For complex focus
  and positioning behavior, assess an accessible primitive library before
  adding a dependency.

Keep table rendering separate from query, filtering, sorting, and pagination
logic. Preserve search, filters, and sorting in the URL when users should be
able to share or return to the same view. On narrow screens, use labeled
horizontal scrolling or a feature-specific card view; do not compress every
column into unreadable text. Row selection and bulk actions should arrive with
an actual workflow.

### Operational data and status language

- Separate semantic intent (`success`, `warning`, `error`, `info`, `neutral`)
  from domain state (`live`, `degraded`, `offline`, `unknown`). The existing
  `live`, `warn`, and `dead` variants remain the current API; plan a deliberate
  mapping/migration rather than silently changing their meaning.
- Keep primary action, destructive action, and alarm emphasis distinguishable.
  Do not make every interesting value orange or every offline node look like a
  confirmed fire. Status always includes text or an accessible label.
- Define neutral missing/unknown values, last-updated time, stale data, initial
  loading, refresh-in-progress, and refresh-failed states. A missing reading
  must not render as zero. Connectivity and measurement freshness are separate
  concepts, determined by the feature/API.
- Show units with measurements and use consistent number/date formatting.
  Relative last-heard text should offer the exact timestamp with a timezone in
  an accessible detail. Preserve the current unit preferences.
- Critical alerts need persistent visible records, status, and history. Do not
  rely on a toast, animation, or color alone to communicate them.

### Making the kit more mature

1. Keep the native-element allowlist scoped to shared components. The current
   `AGENTS.md` and ESLint rules now match that policy, and custom keyboard
   handlers have been removed where native buttons provide the behavior.
2. Keep the component catalog reviewable. A small development-only gallery can
   show the actual fields, table, loading, validation, and narrow layouts when
   those screens are ready. Do not maintain duplicate demo components.
3. Verify accessibility at the workflow level: keyboard submission, focus,
   labels, field errors, table sorting, contrast, and screen-reader output. The
   current tests cover the component contracts; manual assistive-technology
   review remains part of shipping new interaction patterns.
4. Measure contrast and target sizes against WCAG 2.2 AA before claiming
   conformance. The palette and focus tokens alone do not prove compliance.
5. Continue extracting repeated page CSS only when the same visual contract
   appears in multiple features. Keep Nearby cards, node status, coverage
   diagrams, and other domain presentations in their feature modules.

### Suggested next product work

1. Connect the invite and sign-in screens to the agreed backend session API.
2. Decide whether the node page stays a public network browser or gains an
   authenticated admin device-management view; build the corresponding feature
   components on top of the table and form kit.
3. Add paging, active-filter chips, or overlays only when the API and workflow
   need those interactions.

## Review and verification

The UI kit lives in this repository and follows its release cycle. Import
components directly from the role modules; there is no separate package.

- Native semantics and keyboard behavior belong to the shared components.
  Styling controls appearance without removing form validation or file selection.
- Number fields render non-finite values as an empty draft and never publish
  non-finite edits. An empty draft leaves the feature's last numeric value intact. On blur, optional fields restore that value; required fields stay empty for native validation. Features with live results must use `onEmptyChange` to hide results while the draft is empty.
- File fields retain the native selection so `required` validation and native
  form data remain meaningful. Sliders expose formatted values and help text.
- Run `npm run check` before committing changes to components, consumers, styles,
  or lint rules. This includes types, formatting, structure, JavaScript/CSS lint,
  unused-code analysis, tests, and the production build.
- Automated checks cover keyboard activation and submission, field association,
  numeric editing, file selection, and table sorting. Visual and assistive-
  technology review is still required before claiming accessibility conformance.
