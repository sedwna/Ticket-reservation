# Decisions

- Persistent memory owner: MemSearch.
- Code retrieval owner: Token Savior.
- FCC remains the provider/router layer.
## 2026-06-18
- **Font not loading** — The Google Fonts CDN was being filtered (returning empty response), so Vazirmatn never loaded in the browser
## 2026-06-18
- The charts pull data once on mount and never refetch when filters change, and the reservation table uses only client-side filtering
- assistant: Found it — there's stale "دکترسلامت" data and the charts never refetch
- assistant: Backend has `event_id`, `date_from`, `date_to`, `status` query params but the frontend never sends them
- **Charts never updated** — pulled global data once on mount, ignored filter changes
- **Date filters were decorative** — never passed to any API call
