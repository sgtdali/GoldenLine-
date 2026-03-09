# UI Style Guide - MontajUI Equipment Module

This guide documents the UI/UX patterns, components, and styling standards used in the Equipment Management module of MontajUI. It serves as a reference for maintaining consistency across existing and future pages.

## 1. General Layout & Structure

The application uses a consistent layout structure for its main pages.

*   **Container:** `p-8 h-full min-h-0 grid grid-rows-[auto_1fr]` (or `grid-rows-[auto_auto_auto_1fr]` for more complex headers).
*   **Header Section:**
    *   **Title:** `text-slate-900 text-2xl font-bold`
    *   **Action Buttons:** Located on the right side of the header, typically using `Button` components.
*   **Filter/Search Section:**
    *   Placed below the header.
    *   Uses `Card` component or a flex/grid container.
    *   Inputs and Selects have consistent sizing and spacing.
*   **Content Area:**
    *   **Table Container:** `min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white inventory-scroll`
    *   **Scrollable Area:** The table container is designed to take up the remaining vertical space and scroll internally.

## 2. Typography

*   **Font Family:** `ui-sans-serif, system-ui, sans-serif` (Inter or similar system font).
*   **Page Titles:** `text-2xl font-bold text-slate-900`
*   **Section Headers (Card Titles):** `text-lg font-semibold` or `text-sm font-medium text-slate-500` (for subtitles).
*   **Table Headers:** `text-sm font-medium text-muted-foreground` (often `hsl(var(--muted-foreground))`).
*   **Body Text:** `text-sm text-slate-700` or `text-slate-900`.
*   **Muted Text:** `text-slate-500` or `text-slate-400`.

## 3. Colors & Theming

The application uses a Slate-based neutral palette with semantic colors for status and actions.

*   **Primary/Neutral:** Slate (`slate-50` to `slate-900`).
*   **Success (Positive):** Emerald (`emerald-50` to `emerald-700`).
    *   Used for: "In Stock", "Giriş" (IN) movements, positive differences.
*   **Warning (Caution):** Amber (`amber-50` to `amber-900`).
    *   Used for: "Low Stock", "Expiring Soon", differences in counts.
*   **Destructive (Negative/Error):** Red/Rose (`rose-50` to `rose-700` or `red-600`).
    *   Used for: "Out of Stock", "Expired", "Çıkış" (OUT) movements, negative differences, delete actions.
*   **Info/Secondary:** Blue or standard Slate.

## 4. Components

### 4.1. Buttons (`Button`)
*   **Default (Primary):** Dark background, white text. Used for primary actions (Add, Save).
*   **Outline:** White background, border, dark text. Used for secondary actions (Export, Cancel, Filter).
*   **Ghost:** Transparent background, hover effect. Used for icon-only actions in tables (Edit, Delete).
*   **Destructive:** Red background/text variants for dangerous actions.

### 4.2. Cards (`Card`)
*   Used for grouping content, especially filters and summary statistics.
*   **Structure:** `Card` -> `CardHeader` (optional `CardTitle`) -> `CardContent`.
*   **Spacing:** `space-y-4` or `grid gap-4` within content.

### 4.3. Tables (`Table`)
*   **Structure:** `Table` -> `TableHeader` -> `TableRow` -> `TableHead` / `TableBody` -> `TableRow` -> `TableCell`.
*   **Styling:**
    *   **Header:** Sticky top (`sticky top-0 bg-white z-10`).
    *   **Rows:** `hover:bg-slate-50` for interactivity.
    *   **Cells:** `pl-6` for the first column to align with header.
    *   **Empty State:** A row spanning all columns with centered muted text.
*   **Status Indicators:**
    *   Rows can have background colors for critical states (e.g., `bg-rose-50/70` for below min stock).
    *   Badges are used within cells for status labels.

### 4.4. Badges (`Badge`)
*   **Variants:** `default`, `secondary`, `outline`, `destructive`.
*   **Custom Styling:** Often customized with specific Tailwind classes for precise color matching (e.g., `bg-green-600` for "In Stock").

### 4.5. Forms & Inputs
*   **Labels:** `Label` component, typically `mb-1` or `space-y-1`.
*   **Inputs:** `Input` component, standard height and border.
*   **Selects:** `Select` component with `SelectTrigger`, `SelectContent`, `SelectItem`.

## 5. Page-Specific Patterns

### 5.1. All Products (`EquipmentListAllProduct.tsx`)
*   **Layout:** Header with actions -> Filter bar (Search, Category, Toggles) -> Full-height Table.
*   **Features:**
    *   Row highlighting for low stock (`bg-rose-50/70`) and overdue calibration (`ring-1 ring-amber-200`).
    *   Badges for stock status.

### 5.2. Lokasyon Yönetimi (`EquipmentListLocations.tsx`)
*   **Layout:** Split view (Grid with 2 columns).
    *   **Left:** List of locations (Card).
    *   **Right:** Details/Stock of selected location (Card).
*   **Interactivity:** Clicking a location in the left list updates the right view.
*   **Feedback:** Uses `InventoryFeedbackDialog` for success/error messages.

### 5.3. Hızlı Envanter İşlemleri (`EquipmentListStockMovement.tsx`)
*   **Layout:** Tabbed interface (Zimmet, İade, Transfer, etc.) or Mode-based switching.
*   **Product Cards:**
    *   Grid layout of product cards.
    *   **Card Content:** Image/Icon, Title, SKU, Stock Badge.
    *   **Selection:** Clicking adds to a "Selected Items" list (often a sidebar or bottom panel).
*   **Calibration UI:**
    *   Ruler icon with Tooltip.
    *   Dynamic text for calibration status (Days remaining).

### 5.4. Aktif Zimmetler (`EquipmentListAssignments.tsx`)
*   **Layout:** Header -> Summary Cards (Total, Age Buckets) -> Filters -> Table.
*   **Summary Cards:** Row of small cards displaying counts for different aging buckets (0-30, 31-60, etc.).
*   **Table:**
    *   Columns: Personnel, Item, Quantity, Date, Days, Aging.
    *   **Aging Column:** Color-coded text/badges based on duration.

### 5.5. Hareket Raporu (`EquipmentMovementReport.tsx`)
*   **Layout:** Header -> Filters (Card) -> Table.
*   **Filters:** Date range, Item, Personnel, Movement Type toggles.
*   **Table:**
    *   **Movement Type:** Badge with icon (ArrowUp/Down) and color coding.
    *   **Quantity:** Colored text (+Green, -Red) based on movement direction.

## 6. Iconography
*   **Library:** `lucide-react`.
*   **Common Icons:**
    *   `Search`, `Plus`, `Filter`, `Download` (Actions).
    *   `Trash2`, `Pencil` (Edit/Delete).
    *   `MapPin` (Location).
    *   `ArrowUp`, `ArrowDown`, `RefreshCcw`, `AlertTriangle` (Movement Types).
    *   `Ruler` (Calibration).

## 7. Best Practices
*   **Consistency:** Always use the defined component library (`src/components/ui`) instead of raw HTML elements.
*   **Responsiveness:** Use `md:flex-row`, `md:grid-cols-X` to adapt layouts for larger screens.
*   **Feedback:** Provide visual feedback for actions (loading states, success/error dialogs/toasts).
*   **Empty States:** Always handle empty data states gracefully in tables and lists.
