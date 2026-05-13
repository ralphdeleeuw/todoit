# Todoit – Design System

Use this document when building or modifying UI in this codebase. Follow these conventions exactly — do not introduce new patterns unless the existing ones cannot cover the case.

---

## Stack

- **Tailwind CSS v4** (utility-first, `@import "tailwindcss"` in globals.css)
- **Radix UI** for interactive primitives (Dialog, Select, Checkbox, Label)
- **Lucide React** for icons
- **next/link** for all internal navigation — never `<a href>`

---

## Design Tokens

Defined as CSS custom properties in `globals.css`. Always use these via `var()` or their Tailwind equivalents — never hardcode hex values for structural colors.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#ffffff` | `#0f0f13` | Page background |
| `--foreground` | `#171717` | `#f5f5f7` | Body text |
| `--primary` | `#4f46e5` | `#6366f1` | Buttons, active states |
| `--primary-hover` | `#4338ca` | `#818cf8` | Button hover |
| `--muted` | `#f3f4f6` | `#1f1f26` | Subtle backgrounds |
| `--muted-foreground` | `#6b7280` | `#9ca3af` | Secondary text |
| `--border` | `#e5e7eb` | `#2d2d38` | All borders |
| `--ring` | `#4f46e5` | `#6366f1` | Focus rings |
| `--destructive` | `#ef4444` | — | Delete / error |
| `--success` | `#22c55e` | — | Completed states |
| `--warning` | `#f97316` | — | Overdue / warnings |

In Tailwind classes use `border-[var(--border)]`, `bg-[var(--background)]`, etc.

---

## Typography

System font stack — no custom fonts loaded.

| Role | Classes |
|---|---|
| Page title | `text-2xl font-bold text-gray-900 dark:text-white` |
| Section heading | `text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider` |
| Body / label | `text-sm text-gray-700 dark:text-gray-300` |
| Secondary / meta | `text-xs text-gray-400 dark:text-gray-500` |
| Error text | `text-sm text-red-600 dark:text-red-400` |

---

## Color Usage

- **Indigo** (`indigo-600` / `indigo-500` dark) — primary actions, active nav, focus rings
- **Gray** — all neutral UI (cards, borders, secondary text)
- **Red** — destructive actions, errors, overdue dates
- **Green** (`#166534` bg / `#16a34a` inner) — completed/success states (checkmark badge in logo)
- **Orange** (`f97316`) — today's due date, warnings

---

## Spacing & Layout

- Max content width: `max-w-2xl mx-auto px-4` on mobile, `max-w-lg` for dialogs/sheets
- Page vertical padding: `py-6`
- Card padding: `p-4` (settings), `p-3.5` (task cards), `p-5` (dialog body)
- Section spacing: `mb-6` between major sections, `space-y-2` between list items

---

## Components

### Card / List Item

```tsx
<div className="rounded-xl border border-[var(--border)] bg-white dark:bg-gray-900 shadow-sm hover:shadow transition-all hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer">
  <div className="flex items-center gap-3 p-3.5">
    {/* content */}
  </div>
</div>
```

### Primary Button

```tsx
<button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm hover:shadow">
  <Plus className="w-4 h-4" />
  Label
</button>
```

### Destructive / Ghost Button

```tsx
// Ghost (cancel)
<button className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">

// Icon destructive
<button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
  <Trash2 className="w-4 h-4" />
</button>
```

### FAB (Floating Action Button)

```tsx
<button className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95">
  <Plus className="w-6 h-6" />
</button>
```

### Input / Textarea

```tsx
<input className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition" />
```

### Toggle (custom checkbox)

```tsx
<div className={cn("w-10 h-6 rounded-full transition-colors", enabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700")}>
  <div className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-4" : "translate-x-0")} />
</div>
```

### Error Banner

```tsx
<div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
  {message}
</div>
```

### Section Label (settings style)

```tsx
<h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
  Sectienaam
</h2>
```

---

## Dialog / Bottom Sheet

On mobile: slides up from the bottom (`inset-x-0 bottom-0 rounded-t-2xl`).  
On desktop: centered modal (`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg rounded-2xl`).

```tsx
<Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
<Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-gray-900 md:rounded-2xl rounded-t-2xl shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95">
```

**Do not use `backdrop-blur`** on Dialog overlays — it causes rendering issues on Android Chrome.

Dialog header (sticky):
```tsx
<div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-white dark:bg-gray-900">
  <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">Titel</Dialog.Title>
  <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
    <X className="w-4 h-4" />
  </Dialog.Close>
</div>
```

---

## Radix UI Select

Always use a non-empty string sentinel (`"__none__"`) for "no selection" items — never `value=""`.

```tsx
<Select.Root value={value} onValueChange={setValue}>
  <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
    <Select.Value placeholder="Kies..." />
    <Select.Icon><ChevronDown className="w-4 h-4 text-gray-400" /></Select.Icon>
  </Select.Trigger>
  <Select.Portal>
    <Select.Content className="z-50 overflow-hidden rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 shadow-lg">
      <Select.Viewport className="p-1">
        <Select.Item value="__none__" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 cursor-pointer outline-none data-[highlighted]:bg-gray-50 dark:data-[highlighted]:bg-gray-700">
          <Select.ItemText>Geen</Select.ItemText>
        </Select.Item>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

---

## Navigation

### Mobile bottom nav
Fixed, `z-20`, height ~60px. Each item: `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium`.  
Active: `text-indigo-600 dark:text-indigo-400`. Inactive: `text-gray-500 dark:text-gray-400`.

### Sidebar (desktop, md+)
Width `w-60`, `sticky top-0 h-screen`. Nav items: `px-3 py-2 rounded-lg text-sm font-medium`.  
Active: `bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300`.

### FAB position
`bottom-20` on mobile (clears the 60px nav + margin), `bottom-6` on `md+`.

---

## Icons

Use **Lucide React** exclusively. Standard sizes:

| Context | Size |
|---|---|
| Nav / action | `w-5 h-5` |
| Button inline | `w-4 h-4` |
| Small meta | `w-3 h-3` |
| Dialog close | `w-4 h-4` |

---

## Dark Mode

Uses `prefers-color-scheme` media query (no manual toggle). Always pair light and dark variants:
- `text-gray-900 dark:text-white`
- `bg-white dark:bg-gray-900`
- `bg-gray-100 dark:bg-gray-800`
- `border-[var(--border)]` (token handles both modes automatically)

---

## PWA / Mobile Rules

- All interactive elements need a minimum tap target of ~44px (use `p-2` or larger on icon buttons)
- All `<button>` elements must have `type="button"` unless they are form submit buttons
- No `backdrop-blur` on overlays
- Bottom nav is always visible on mobile — content needs `pb-20` padding on the main scroll area
- FAB sits at `z-30`, bottom nav at `z-20`, dialogs at `z-40`/`z-50`

---

## File Conventions

| Path | Purpose |
|---|---|
| `src/app/(app)/*/page.tsx` | Server component, calls `verifyFamily()`, passes data to client |
| `src/app/(app)/*/[Name]Client.tsx` | Client component with SWR / state |
| `src/app/(app)/error.tsx` | Error boundary for the app segment |
| `src/app/global-error.tsx` | Root-level error boundary |
| `src/components/tasks/` | Shared task UI (TaskCard, TaskForm, TaskList, TaskDetailSheet, NewTaskButton) |
| `src/components/layout/` | AppShell, navigation |
| `src/lib/` | Server-only logic (dal.ts, recurrence.ts, push.ts, permissions.ts) |
| `src/app/api/` | API routes — always call `requireFamily()` first |
