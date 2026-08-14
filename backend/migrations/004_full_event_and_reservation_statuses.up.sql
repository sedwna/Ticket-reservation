-- Keep manual SQL migrations aligned with the statuses supported by the application.
ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_events_status;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events
    ADD CONSTRAINT chk_events_status
    CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED', 'CLOSED'));

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_reservations_status;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations
    ADD CONSTRAINT chk_reservations_status
    CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED'));
