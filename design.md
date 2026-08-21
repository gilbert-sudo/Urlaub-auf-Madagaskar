# Generic Admin Dashboard Design System

This document outlines the standard design rules, aesthetic principles, and UI components used in this admin architecture. It is abstracted to serve as a foundation for any modern admin dashboard project.

## 1. Tech Stack & Libraries
- **CSS Framework:** Tailwind CSS
- **Iconography:** [Lucide React](https://lucide.dev/) (or similar SVG icon sets)
- **Theme Support:** Native Dark/Light mode utilizing Tailwind's `dark:` variant mechanism.

## 2. Core Aesthetics
The architecture leverages a "Glassmorphism + Modern UI" style with a heavy focus on deep contrast, large border radii, and soft shadows.

- **Border Radius:** Very high roundness is preferred. Large containers use `rounded-[2rem]`, medium elements use `rounded-2xl` or `rounded-xl`, and small badges use `rounded-full`.
- **Shadows:** Deep, soft shadows for elevated containers: `shadow-xl shadow-gray-200/30 dark:shadow-black/40`. Hover states push this to `shadow-2xl`.
- **Borders:** Subtle, low-opacity borders on cards: `border border-gray-200/80 dark:border-neutral-800`.
- **Transitions:** Smooth micro-interactions on hover (e.g., `transition-all duration-300`, `group-hover:scale-110` for icons, `hover:bg-gray-50/50`).

## 3. Color System
### Backgrounds
- **App Background:** `bg-gray-50` (Light) / `bg-gray-950` (Dark)
- **Cards & Containers:** `bg-white` (Light) / `bg-neutral-900` (Dark)
- **Sidebar (Desktop/Mobile):** `bg-gray-900` (always dark, for contrast)

### Typography
- **Primary Text:** `text-gray-900` (Light) / `text-white` or `text-gray-100` (Dark)
- **Muted Text (Labels/Descriptions):** `text-gray-500` or `text-gray-400`

### Accents & Semantic Colors
- **Primary Brand Accent:** Teal / Emerald (`#00A693` / `text-[#2dd4bf]`). Used for primary CTAs and active states.
- **Gradients:** Soft gradients for special banners or icons (e.g., `from-brand-primary to-brand-secondary`).
- **Semantic Status Colors:**
  - **Info/Primary:** Blue (`bg-blue-50 text-blue-600`) - Used for general information blocks.
  - **Warning/Pending:** Amber (`bg-amber-50 text-amber-600`) - Used for items under review or requiring attention.
  - **Success/Verified:** Emerald (`bg-emerald-50 text-emerald-600`) - Used for approved states or success metrics.
  - **Danger/Error:** Rose/Red (`bg-rose-50 text-rose-600`) - Used for errors, deletions, or destructive actions.
  - **Highlight/Categorical:** Purple or Pink - Used to differentiate specific, less common data sections.

## 4. Typography Rules
- **Font Family:** Modern Sans-Serif (`font-sans` - e.g., Inter, Roboto, or system fonts).
- **Headings & Numbers:** Heavy weighting for emphasis on KPIs and page titles (`font-extrabold`, `font-black`).
- **Section Titles:** Usually `text-base font-extrabold` or `text-lg font-extrabold`.
- **Metadata / Field Labels:** A strict, consistent pattern used across all forms and data displays:
  `text-[11px] font-extrabold text-gray-400 uppercase tracking-wider`
- **Data Values:** `text-sm font-bold text-gray-900 dark:text-white`.

## 5. Layout Structures
### Main Application Shell
- **Desktop:** Fixed left sidebar (`w-64 fixed inset-y-0 left-0`), main content pushed right (`pl-64`).
- **Mobile:** Hamburger menu triggers an off-canvas drawer sidebar with a backdrop blur (`backdrop-blur-xs`).
- **Top Bar:** Sticky header with backdrop blur (`sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md`).

### Data Cards / KPI Blocks
Follow a standard structure for dashboard metrics:
1. Container with `rounded-[2rem] p-6 shadow-xl relative overflow-hidden group`.
2. Flexbox row for Header (Title + Value) + Icon.
3. Icon placed inside a `w-12 h-12 rounded-2xl` colored block with `group-hover:scale-110 transition-transform`.
4. Footer separated by `border-t border-gray-100 dark:border-neutral-800 pt-4 mt-4`.

### Sectioned Forms & Detailed Views
For displaying complex entities or settings:
- Group data into logical, thematic sections.
- Each section is an elevated card (`rounded-[2rem]`) with a colored header banner containing an icon related to the section's context.
- Data fields inside the card are displayed in responsive CSS Grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`).

## 6. Atomic Components
- **Badges/Tags:** Pill-shaped, often utilizing soft background opacities (e.g., `bg-primary/10 text-primary font-bold text-xs px-3.5 py-1.5 rounded-xl border border-primary/20`).
- **Loading States:** Custom CSS spinners using border transparency (e.g., `w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin`).
- **Empty States:** Rendered inside heavily rounded containers with muted icons and descriptive italicized or muted text (`text-gray-400 italic font-medium`).
