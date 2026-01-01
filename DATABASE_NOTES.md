# Datenbank-Hinweise

## Migrations

**WICHTIG:** Datenbank-Änderungen immer nur direkt in Turso DB ausführen, nicht lokal.

Lokale sqlite.db Datei soll nicht verwendet werden.

## Pending Migrations

### 0004: Add nickname field
```sql
ALTER TABLE users ADD COLUMN nickname TEXT;
```
