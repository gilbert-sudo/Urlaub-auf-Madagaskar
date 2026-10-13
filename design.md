# Madagascar Bespoke Expedition — Design System & UI Rules

This document establishes the official design system, aesthetic standards, and UI component blueprints for the **Urlaub auf Madagaskar / Madagascar Trips & Pics** software suite. All current and future views, modules, and components must adhere to these rules.

---

## 1. Design Philosophy: "Luxury Travel Atelier"

The software is styled as a **high-end travel atelier** (comparable to Virtuoso, Belmond, or Abercrombie & Kent private portals). It blends **deep volcanic Madagascar crimson**, **sunflower gold accents**, **frosted glassmorphism**, and **ultra-rounded geometry** (`rounded-3xl` / `rounded-4xl`).

### Core Aesthetic Pillars
- **Ultra-Rounded Geometry**: Strict avoidance of sharp corners. Main containers and cards use `rounded-3xl` (1.5rem) or `rounded-4xl` (2rem). Buttons, badges, and filters use `rounded-full`.
- **Frosted Glassmorphism**: Translucent panels (`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800`) paired with subtle top-edge glare effects.
- **Deep Shadows & Glows**: Elevated containers leverage colored brand shadows (e.g. `shadow-xl shadow-brand-primary/25` or `shadow-slate-200/40 dark:shadow-black/25`).
- **No Disconnected Floating Bottom Bars**: Action buttons must live directly inside sticky page headers or within companion preview dossiers.

---

## 2. Color Palette & Brand Tokens

| Token | Hex / Classes | Usage |
| :--- | :--- | :--- |
| **Brand Primary (Molten Lava)** | `#811303` | Primary identity, active indicators, brand badges |
| **Brand Secondary (Rich Mahogany)** | `#441008` | Gradient depths, card banner bases |
| **Brand Accent (Sunflower Gold)** | `#E8B72F` / `text-amber-400` | Sparkles, gold divider rules, currency accents |
| **Brand Gradient (Buttons & CTAs)** | `bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary` | Primary action buttons with `shadow-xl shadow-brand-primary/25` |
| **Surface Light** | `bg-slate-50` / `#f8fafc` | Main application background (Light mode) |
| **Surface Dark** | `bg-slate-900` / `#0f172a` | Main application background (Dark mode) |
| **Glass Panel** | `bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl` | Card containers, modal shells, sticky banners |

---

## 3. Workflow Status Tokens

Status badges use a dual-layer color system featuring a **pulsing dot** and an **accented gradient pill border**:

```jsx
const STATUS_CONFIG = {
  Inquiry: {
    label: 'Inquiry',
    badgeClass: 'from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
    dotClass: 'bg-amber-500'
  },
  Proposal: {
    label: 'Proposal',
    badgeClass: 'from-sky-500/20 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700/50',
    dotClass: 'bg-sky-500'
  },
  Booked: {
    label: 'Booked',
    badgeClass: 'from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50',
    dotClass: 'bg-purple-500'
  },
  Active: {
    label: 'Active',
    badgeClass: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50',
    dotClass: 'bg-emerald-500'
  },
  Completed: {
    label: 'Completed',
    badgeClass: 'from-slate-500/20 to-slate-500/5 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700/50',
    dotClass: 'bg-slate-500'
  }
};
```

---

## 4. Typography Hierarchy

- **Display Headings**: `font-display` ([Outfit](https://fonts.google.com/specimen/Outfit)) with `font-black tracking-tight text-slate-900 dark:text-white`.
- **UI Body & Inputs**: `font-sans` ([Inter](https://fonts.google.com/specimen/Inter)) with `font-semibold` or `font-bold`.
- **Pre-Title Badges**:
  ```jsx
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
    <Sparkles size={11} className="text-brand-accent" />
    Expedition Atelier
  </span>
  ```
- **Field Labels**:
  ```jsx
  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
    Expedition Title <span className="text-brand-primary">*</span>
  </label>
  ```

---

## 5. Sticky Header Architecture (Universal Standard)

Every page must implement the **two-tier sticky architecture** so headers and actions remain accessible during scroll:

### Tier 1: Global App Header
- **Position**: `sticky top-0 z-40`
- **Height**: `min-h-[70px] md:min-h-[76px]`
- **Styles**: `bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 md:px-8 xl:px-12`

### Tier 2: Page Header Banner
- **Position**: `sticky top-[70px] md:top-[76px] z-30`
- **Horizontal Bleed**: `-mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12`
- **Styles**: `bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`

#### Page Header Blueprint
```jsx
<div className="sticky top-[70px] md:top-[76px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    {/* Optional Circular Back Button */}
    <button 
      onClick={() => navigate(-1)} 
      className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-50/30 transition-all duration-300 group shrink-0"
    >
      <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
    </button>
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
          <Sparkles size={11} className="text-brand-accent" />
          Voyage Portfolio
        </span>
        <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
        Page Title
      </h1>
    </div>
  </div>

  {/* Header Action Controls */}
  <div className="flex items-center gap-3">
    <button className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/45 transition-all">
      Primary CTA
    </button>
  </div>
</div>
```

---

## 6. Executive KPI Strip Standard

Dashboard and directory pages feature a **4-column KPI strip** using rounded glass cards with brand color icon blocks:

```jsx
<div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 flex items-center gap-4 relative overflow-hidden group">
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-md shadow-brand-primary/20 flex-shrink-0">
    <Compass size={22} />
  </div>
  <div className="min-w-0">
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Expeditions</p>
    <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display mt-0.5">
      {count}
    </h4>
    <p className="text-[10px] text-slate-500 truncate mt-0.5">Contextual subtext</p>
  </div>
  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
```

---

## 7. Form Layout: "The 2-Column Atelier"

Complex forms (like `CreateTripPage`) avoid traditional multi-step wizards in favor of a cohesive **2-column atelier layout**:

1. **Left Column (7–8 Columns)**:
   - Grouped into thematic cards (`rounded-3xl p-6 sm:p-8`).
   - Each card features a section badge (e.g. `01 / IDENTIFIERS`), a gradient icon, and uppercase tracking headers.
   - Large rounded inputs (`rounded-2xl` or `rounded-full`) with `border-2 border-slate-100 dark:border-slate-800 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10`.
   - Clickable suggestion tags / inspiration chips below inputs.

2. **Right Column (4–5 Columns)**:
   - **Sticky Companion Dossier**: A live passport-style preview card.
   - Top banner: Gradient from `brand-secondary` to `brand-primary` with gold separator line (`h-0.5 bg-gradient-to-r from-brand-accent via-amber-300 to-transparent`).
   - Dynamic real-time summary of title, client, pax count, dates, duration, style, and projected price.
   - **In-card submit button**: Full-width primary CTA with loading spinner and hover animation.

---

## 8. Buttons & Interactive Controls

### Primary Action Button
```jsx
<button className="px-6 py-3 rounded-full font-bold text-xs md:text-sm text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/45 transition-all duration-300 flex items-center gap-2 group active:scale-95 disabled:opacity-50">
  <span>Confirm Action</span>
  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
</button>
```

### Secondary Button
```jsx
<button className="px-5 py-2.5 rounded-full font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
  Cancel
</button>
```

### Destructive Action Modal
- Backdrop: `bg-slate-900/50 backdrop-blur-md`
- Container: `rounded-3xl sm:rounded-4xl p-7 border border-slate-200/80 dark:border-slate-800 shadow-2xl`
- Red Caution Icon container: `w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600`
- Confirm Button: `bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-600/30`

---

## 9. Floating Navigation Dock

For deep multi-tab views (such as `TripDetailsPage`), use a docked glass ribbon rather than a full-width bottom bar:

```jsx
<div className="fixed left-0 right-0 bottom-0 md:left-auto md:right-5 md:top-1/2 md:-translate-y-1/2 flex flex-row md:flex-col z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] md:shadow-2xl border-t md:border border-slate-200/80 dark:border-slate-800 rounded-t-3xl md:rounded-3xl py-3 md:py-6 px-4 md:px-3 w-full md:w-[94px] gap-2 sm:gap-6 justify-around overflow-x-auto no-scrollbar transition-all">
  {tabs.map((tab) => (
    <div key={tab.id} className="relative flex flex-col items-center cursor-pointer group">
      {/* Icon + Indicator Dot */}
      <div className={`transition-all duration-300 ${isActive ? 'text-brand-primary scale-110 -translate-y-0.5' : 'text-slate-400 group-hover:text-slate-600'}`}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <div className={`w-1.5 h-1.5 rounded-full bg-brand-primary mt-1 transition-all ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
      </div>
      <span className={`text-[10px] font-black mt-1 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`}>
        {tab.label}
      </span>
    </div>
  ))}
</div>
```

---

## 10. Check-List for New Pages

When developing any new page in the application, verify that:
- [ ] Header implements `sticky top-[70px] md:top-[76px] z-30` with `backdrop-blur-xl` and negative horizontal margin bleed.
- [ ] All card containers use `glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl`.
- [ ] No awkward floating bottom nav bars exist; primary buttons are housed in the sticky header or companion card.
- [ ] Headings use `font-display font-black tracking-tight`.
- [ ] Form fields feature generous padding, `rounded-2xl` corners, and brand focus rings (`focus:ring-brand-primary/10`).
- [ ] Primary buttons feature the brand gradient (`from-brand-primary via-[#9b1908] to-brand-secondary`).
- [ ] Status indicators reference the unified `STATUS_CONFIG` tokens.
- [ ] Dark mode compatibility (`dark:...`) is fully integrated across all elements.
