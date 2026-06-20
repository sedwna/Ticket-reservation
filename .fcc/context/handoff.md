# FCC Handoff

## Must Not Forget
- Persistent memory owner: MemSearch.
- Code retrieval owner: Token Savior.
- FCC remains the provider/router layer.
# Project Facts
- Keep critical machine-local facts in CLAUDE.local.md first.
- Keep this file for durable project facts that should be safe to share with future sessions.
# Project Facts
- Keep critical machine-local facts in CLAUDE.local.md first.

## Current State
- Badge colors: Active=green, Closed=amber, Completed=gray, Cancelled=red
- Filter dropdowns across all pages include the new `CLOSED` status
- ### Test it
- Go to **http://localhost:5175/admin/events** → click the status dropdown on any event row → change to "پایان ثبت‌نام" → the user at `/events` will see that event's CTA button sw...

## Decisions
- **Font not loading** — The Google Fonts CDN was being filtered (returning empty response), so Vazirmatn never loaded in the browser
- The charts pull data once on mount and never refetch when filters change, and the reservation table uses only client-side filtering
- assistant: Found it — there's stale "دکترسلامت" data and the charts never refetch
- assistant: Backend has `event_id`, `date_from`, `date_to`, `status` query params but the frontend never sends them
- **Charts never updated** — pulled global data once on mount, ignored filter changes

## Next Steps
- Run /verify-context before major edits.
- Store raw logs in the SQLite sidecar; do not replay them into chat.
