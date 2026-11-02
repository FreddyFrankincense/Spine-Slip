# Spine & Slip — Archival Physical Media Radar & Collector Vault

Spine & Slip is a specialized command center for physical media collectors that tracks limited-edition box sets, slipcovers, steelbooks, restocks, and price drops across 19 boutique video labels, specialty stockists, and major retailers. It combines a curated archival catalog with live Google Search grounding to verify real-time stock status, retailer pricing, and active label sales against your wishlist target prices.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product decisions incorporate your confirmed preferences from our planning interview. Review these details and click **Proceed** to begin building, or share any adjustments you would like to make.

- **Confirmed Decision — Live Web Search Grounding + Curated Catalog**: Combines a rich pre-populated catalog of iconic boutique releases (4K UHD rigid box sets, limited slipcovers, boutique steelbooks) with on-demand server-side live web search grounding (`gemini-3.8-flash` with `googleSearch`) to check real-time pricing, restocks, and source URLs across boutiques and big-box retailers.
- **Confirmed Decision — Comprehensive 19-Label & Stockist Coverage**: Full coverage of your core five labels (**Shout! Factory**, **Vinegar Syndrome**, **Arrow Video**, **The Criterion Collection**, **Second Sight Films**) plus all selected boutique labels and stockists (**DiabolikDVD**, **OrbitDVD**, **Severin Films**, **Kino Lorber**, **88 Films**, **Radiance Films**, **Umbrella Entertainment**, **Indicator / Powerhouse**, **Deaf Crocodile**, **Eureka! Masters of Cinema**, **Mondo Macabro**, **Terror Vision**, **Grindhouse Releasing**, and **BFI**) alongside major retailers (**Amazon**, **Target**, **Best Buy**, **Walmart**, and **Barnes & Noble**).
- **Confirmed Decision — Full Collector Metadata & Seasonal Sale Calendar**: Tracks 4K UHD vs. Blu-ray formats, Region A/B/C coding, HDR10 / Dolby Vision specs, slipcover/rigid box print-run status (e.g., *1,420 / 5,000 remaining*), target buy price thresholds with multi-retailer price comparison matrices, and a seasonal boutique sale countdown calendar.
- **Confirmed Decision — Dark Archival Cinema Vault Aesthetic**: Styled as a tactile, high-contrast archival screening vault (`#0A0A0C` carbon obsidian canvas, `#121216` matte slipcase surfaces, warm 35mm amber gold `#D97706` and Nitrate Crimson `#E11D48` accents) featuring spine numbers, edition specs, and tabular price matrices.

---

### 1. Overview & Core Concept

- **What It Does**: Monitors boutique physical media storefronts, specialty stockists (DiabolikDVD, OrbitDVD), and mass-market retailers (Amazon, Target, Best Buy, Barnes & Noble) for limited edition restocks, low-stock slipcover warnings, label flash sales, and wishlist price-drop alerts.
- **Target Audience / Persona**: Serious physical media collectors, cinephiles, and archival curators who hunt limited rigid box sets, numbered spine releases, O-card slipcovers, and 4K UHD steelbooks before they go Out of Print (OOP).
- **Key Value**: Eliminates the need to manually check 20+ separate boutique storefronts and retailer listings daily by consolidating multi-retailer price comparisons, print-run exhaustion alerts, seasonal label sale schedules, and live web-grounded price checks into one unified vault.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Wishlist Priority Radar & Alert Triage**: On arrival, collectors see high-priority wishlist alerts (titles that dropped below their custom Target Buy Price or entered low-stock slipcover/rigid-box status at DiabolikDVD/OrbitDVD/direct label stores) alongside a featured limited edition spotlight.
  2. **Multi-Retailer Price & Stock Matrix**: Clicking any release opens the **Contiguous Edition Dossier Drawer**, displaying technical specs (4K UHD + Blu-ray combo, Dolby Vision / HDR10, Region A/B/C, Spine #, Print Run), packaging state (Rigid Slipcase, O-Card Slipcover, Steelbook, Standard), and a side-by-side price comparison table across Direct Boutique Store, Specialty Stockists (DiabolikDVD, OrbitDVD), and Major Retailers (Amazon, Target, Best Buy, Barnes & Noble) with direct verified links.
  3. **Live Web Grounding Scanner**: Collectors can click **Scan Live Retailers** on any wishlist title—or enter any custom title/UPC/label release in the **Live Retailer Recon Modal**—to trigger a server-side Gemini Google Search grounded lookup that fetches current pricing, stock availability, and verified store URLs across boutique and mass-market retailers.
  4. **Boutique Sale Calendar & Flash Countdown**: Switching to the **Sale Calendar** view shows active and upcoming annual boutique events (e.g., *Criterion 24-Hour 50% Flash Sale*, *Barnes & Noble 50% Off Criterion November Month*, *Vinegar Syndrome Black Friday & Halfway to Black Friday*, *Arrow Shocktober / Camp Arrow*, *Severin Mid-Year Sale*, *Kino Lorber Wonderland Sale*) with countdown timers and automatic wishlist cross-referencing showing which wishlisted items qualify for the sale.
  5. **Add / Prioritize Wishlist Edition**: Collectors can add new titles to their wishlist with custom target buy prices, priority tiers (Critical Grail, High Priority, Wait for 50% Sale), and preferred packaging requirements (Must Include Slipcover / Rigid Box Only / Steelbook).

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Dark Archival Cinema Vault** — inspired by Criterion spine numbering, Second Sight rigid linen boxes, Vinegar Syndrome foil slipcovers, and reference-grade 35mm restoration grading suites.
  - *Color Palette & Mood (60-30-10 Discipline)*:
    - **60% Dominant Neutral Canvas**: Deep Carbon Vault `#0A0A0C` (`--background`) with subtle warm-tinted charcoal undertones.
    - **30% Structural Surfaces**: Matte Slipcase Charcoal `#121216` (`--surface`) with 1px hairline borders `#232329` (`--border`) and Archival Silver-White `#F4F4F6` primary typography paired with Muted Slate `#9CA3AF` metadata.
    - **10% Accent Budget**: Concentrated at primary actions and critical collector states:
      - **35mm Amber Gold (`#F59E0B`)**: Primary interactive focus, Spine/Limited Edition numbering, and target-price match highlights.
      - **Archival Emerald (`#10B981`)**: Price below target threshold / Confirmed Restock.
      - **Nitrate Crimson (`#F43F5E`)**: Low Print Run (<10% stock remaining) / Going OOP Alert.
  - *Typography & Hierarchy (2+1 Font Rule)*:
    - **Display / Film Titles**: `Fraunces` (editorial high-contrast serif evoking classic cinema title cards and Criterion essays), constrained with `text-wrap: balance` and `clamp(2rem, 3.5vw, 3.25rem)`.
    - **UI & Collector Metadata**: `Plus Jakarta Sans` (clean, legible neo-grotesque for dense filter bars, retailer names, and edition specs).
    - **Spine Numbers, Prices & Print Runs**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` for vertical decimal alignment across retailer price matrices, print run counters (`1,250 / 5,000`), and countdown clocks.
  - *Component Styling & Layout*:
    - **Strict Top Bar Contract**: Single-row header with 3 zones separated by `gap-8`:
      1. *Brand Zone*: Single-line wordmark `Spine & Slip` (`whitespace-nowrap shrink-0`).
      2. *Navigation Zone*: 4 single-line links (`Vault Radar`, `Wishlist Priority`, `Boutique Labels`, `Sale Calendar`).
      3. *Primary Action Zone*: 1 primary CTA button (`Scan Live Retailers`).
    - **Zero-Pill Metadata Discipline**: All static release metadata (Format, HDR spec, Region code, Spine #, Release Year, Packaging type) is rendered as clean, unboxed inline typography separated by middle dots (`4K UHD · Dolby Vision · Region Free · Spine #1192 · Rigid Box`), never wrapped in candy pill chips. Interactive filter controls use tactile segmented button groups.
    - **1440px Desktop Presence & Single-Elevation Depth**: Full-width archival grid with subtle 1px hairline borders (`#232329`), generous `24px` container padding, and zero nested card-in-card clutter.

- **Interactive Feedback & Motion**:
  - Subtle `150ms` `translateY(-2px)` cover-art lift on release cards (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Shimmering skeleton rows during live Google Search retailer scans, paired with real-time verification timestamps and clickable source citations.
  - Instant toast feedback when updating target buy prices, toggling wishlist priority, or logging a new edition.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Curated Catalog + Live Gemini Search Grounding**
  - *Chosen Approach*: Pre-populate the vault with an authentic, deeply detailed catalog of sought-after releases across all 19 requested boutique labels and major retailers, while providing a live server-side `/api/radar/scan` endpoint powered by `gemini-3.8-flash` with `googleSearch` grounding.
  - *Why*: Direct client-side scraping of Amazon, Target, DiabolikDVD, or Vinegar Syndrome is blocked by CORS and bot-protection firewalls. Using server-side Google Search grounding allows the app to perform real web lookups for current retailer prices, restock announcements, and store URLs on demand, while the curated dataset ensures zero-latency browsing, filtering, and price-threshold simulation out of the box.
  - *Alternatives Considered*: Pure manual entry (too much friction on initial load) or client-side fetch scraping (fails due to browser CORS policies).

- **Decision 2: Persistent Collector Vault State with Custom Price Thresholds**
  - *Chosen Approach*: Synchronize user wishlist priorities, custom Target Buy Prices, alert rules (e.g., *Alert on Slipcover < 500 units*, *Alert when Amazon/Target drops ≥ 15% below Boutique Direct*), and newly discovered releases via `localStorage` backed by a server-side in-memory/JSON sync API.
  - *Why*: Ensures instant interactive responsiveness when adjusting target prices, reprioritizing grails, or saving live search results without requiring external account login friction.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         TOP BAR NAVIGATION CONTRACT                          │
│  [Spine & Slip]     [Vault Radar · Wishlist Priority · Labels · Sale Calendar]│
│                                                       [+ Scan Live Retailers]│
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────┐
│   VAULT RADAR &     │   │   WISHLIST PRIORITY &   │   │ BOUTIQUE LABELS &    │
│ EDITION CATALOG VIEW│   │  PRICE-DROP MATRIX VIEW │   │ SALE CALENDAR VIEW   │
│ ─────────────────── │   │ ─────────────────────── │   │ ──────────────────── │
│ • Featured Grail    │   │ • Priority Tier Sorter  │   │ • 19 Boutique Label  │
│   Spotlight Hero    │   │   (Grail / High / Sale) │   │   Index & Filters    │
│ • Multi-Facet Filter│   │ • Target Price Slider & │   │ • Seasonal Flash Sale│
│   (Label, Packaging,│   │   Threshold Match State │   │   Countdown Cards    │
│    4K/BD, Region,   │   │ • Boutique vs Big-Box   │   │ • Wishlist Cross-Ref │
│    Restock/Sale)    │   │   Spread Comparison     │   │   ("5 Wishlist Items │
│ • Release Grid with │   │ • Slipcover & OOP Risk  │   │    Eligible in Sale")│
│   Spine & Print Run │   │   Progress Indicators   │   │                      │
└──────────┬──────────┘   └────────────┬────────────┘   └──────────┬───────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              INTERACTIVE DRAWERS & LIVE RECON MODALS (CLIENT)                │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ Contiguous Edition Dossier Drawer  │  │ Live Retailer Recon & Add Modal│  │
│  │ • 4K/HDR/Region/Spine Specs        │  │ • Search any Title / Label     │  │
│  │ • Multi-Retailer Price Table       │  │ • Live Grounded Price & Stock  │  │
│  │ • Target Price Editor & Alert Rule │  │ • One-Click Add to Wishlist    │  │
│  └─────────────────┬──────────────────┘  └────────────────┬───────────────┘  │
└────────────────────┼──────────────────────────────────────┼──────────────────┘
                     │ POST /api/radar/scan                 │ POST /api/radar/discover
                     ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND SERVER (PORT 3000)                       │
│  • /api/radar/scan     → Verifies live prices & stock for an existing title  │
│  • /api/radar/discover → Searches web for a new boutique release & retailers │
│  • Shared GoogleGenAI Client (`gemini-3.8-flash` + `tools: [{googleSearch}]`)│
│  • Extracts structured pricing intelligence + `groundingChunks` source URLs  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **BoutiqueRelease**:
    - `id`, `title`, `director`, `year`, `label` (one of the 19 supported boutique labels), `spineNumber` (e.g., `Criterion #1204`, `VS-452`, `Second Sight #048`).
    - `editionType`: `'Rigid Box Set' | 'Limited Slipcover' | 'Boutique Steelbook' | 'Standard Edition' | 'Mediabook'`.
    - `technicalSpecs`: `{ format: '4K UHD + Blu-ray' | '4K UHD' | 'Blu-ray', hdr: 'Dolby Vision / HDR10' | 'HDR10' | 'SDR', region: 'Region Free' | 'Region A' | 'Region B' | 'Region A/B/C', aspectRatio: string, audio: string }`.
    - `printRun`: `{ limited: boolean, totalUnits?: number, remainingEstimate?: number, slipcoverStatus: 'In Stock (With Slip)' | 'Low Slip Stock (<10%)' | 'Rigid Box Active' | 'Standard Only (Slip OOP)' | 'Near OOP' }`.
    - `wishlist`: `{ isWishlisted: boolean, priority: 'Critical Grail' | 'High Priority' | 'Wait for 50% Sale', targetPrice: number, notes?: string }`.
    - `msrp`: `number`.
    - `retailerListings`: Array of `RetailerOffer`:
      - `retailer`: `'Direct Label Store' | 'DiabolikDVD' | 'OrbitDVD' | 'Amazon' | 'Target' | 'Best Buy' | 'Walmart' | 'Barnes & Noble'`.
      - `retailerCategory`: `'Boutique Direct' | 'Specialty Stockist' | 'Major Retailer'`.
      - `price`: `number`, `previousPrice?: number`, `inStock`: `boolean`, `stockNote`: `string` (e.g., *"Includes Limited Foil Slipcover"*, *"Price Matched to B&N 50% Sale"*, *"Restocked — 4 copies left"*), `isSale`: `boolean`, `lastChecked`: `string`, `url`: `string`.
  - **BoutiqueSaleEvent**:
    - `id`, `label`, `saleName` (e.g., *Criterion 50% Off November Sale at Barnes & Noble*, *Vinegar Syndrome Black Friday Flash Pre-Order & Main Event*, *Arrow Video Shocktober Sale*, *Second Sight Direct Restock Drop*, *Severin Films Black Friday*, *Kino Lorber Winter Wonderland*), `discountSummary` (e.g., *50% Off SRP*), `status` (`'Active Now' | 'Starts Soon' | 'Upcoming'`), `startDate`, `endDate`, `description`, `matchingWishlistCount`.

- **Interactive Component & State Mapping**:
  - **Top Bar Navigation & Action Button**: Clicking `Vault Radar`, `Wishlist Priority`, `Boutique Labels`, or `Sale Calendar` switches the primary workspace view immediately. Clicking `Scan Live Retailers` opens the **Live Retailer Recon & Add Modal**.
  - **Multi-Facet Filter & Search Bar**: Instant client-side filtering across search query (title, director, spine #), Boutique Label (all 19 labels selectable), Edition Packaging (`Rigid Box Set`, `Limited Slipcover`, `Boutique Steelbook`), Format/Region (`4K UHD`, `Region B Import`, `Dolby Vision`), and Alert Trigger (`Below Target Price`, `Recent Restock`, `Active Label Sale`, `Low Print Run Risk`).
  - **Wishlist Priority & Target Price Controls**: Inside both the **Wishlist Priority View** and the **Edition Dossier Drawer**, users can toggle wishlist membership, cycle priority tier (`Critical Grail`, `High Priority`, `Wait for 50% Sale`), and adjust their numeric `Target Buy Price` via stepper or direct input. Adjusting the target price immediately recalculates whether the lowest available retailer offer triggers a **Target Price Met** alert badge and updates the portfolio savings summary.
  - **Live Grounded Retailer Check (`/api/radar/scan` & `/api/radar/discover`)**:
    - Clicking **Verify Live Prices** on any release sends its title, label, and edition type to the Express backend (`/api/radar/scan`).
    - The server calls `ai.models.generateContent` using `gemini-3.8-flash` with `tools: [{ googleSearch: {} }]` to query current availability and pricing across the label's official store, DiabolikDVD, OrbitDVD, Amazon, Target, and Barnes & Noble.
    - The response updates the item's live intelligence briefing, appends verified grounding source links (`groundingChunks`), and lets the user apply discovered price updates directly to the release's retailer table.
    - In the **Live Retailer Recon & Add Modal**, users can type any film title + label (e.g., *"The Hitcher 4K Second Sight"* or *"Texas Chain Saw Massacre 4K Dark Sky Steelbook"*) to run a live grounded search and add the newly structured release directly into their Wishlist Vault.
