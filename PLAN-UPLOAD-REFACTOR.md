# Plan: Upload-Ordner von statischen Bildern trennen

## Status: Implementiert

Die Code-Änderungen und DB-Migration wurden durchgeführt. Folgende manuelle Schritte sind noch erforderlich:

---

## Erledigte Schritte

- [x] **Phase 1.1:** Ordnerstruktur `public/uploads/countries` und `public/uploads/news` erstellt
- [x] **Phase 1.2:** Neue API-Route `app/api/uploads/[...path]/route.ts` erstellt
- [x] **Phase 1.3:** Upload-Routes angepasst (`country-image`, `news-image`)
- [x] **Phase 2:** Bestehende 57 Upload-Bilder nach `public/uploads/countries/` verschoben
- [x] **Phase 3:** Neue Bilder verarbeitet (Belgium, Luxembourg, Norway, UK)
- [x] **Phase 4:** Datenbank-Migration durchgeführt (alle Pfade aktualisiert)

---

## Manuelle Schritte (TODO)

### 1. Coolify Volume konfigurieren

In Coolify → Persistent Storage:

**Neues Volume hinzufügen:**
```
Source Path:      /data/geomaster/uploads
Destination Path: /app/public/uploads
```

**Altes Volume entfernen (nach erfolgreichem Test):**
```
/data/geomaster/images → /app/public/images
```

### 2. Deploy durchführen

```bash
git add .
git commit -m "refactor: Separate upload directory from static images"
git push
```

Dann in Coolify den Build abwarten.

### 3. Bilder auf Server kopieren

Nach dem Deploy die Upload-Bilder auf den Server kopieren:

```bash
scp -r public/uploads/* root@78.46.189.129:/data/geomaster/uploads/
```

### 4. Verifikation

Nach Abschluss prüfen:
- [ ] Alle Länder-Karten zeigen Flaggen
- [ ] Alle Länder-Karten zeigen Card-Images
- [ ] Belgium, Luxembourg, Norway, UK haben alle Bildtypen
- [ ] Neuer Upload im Admin funktioniert
- [ ] Nach Redeploy sind alle Bilder noch da

---

## Verarbeitete Bilder (Phase 3)

| Land | Typ | Dateiname |
|------|-----|-----------|
| Belgium | landmark | belgium-landmark-1768861394719.webp |
| Belgium | card | belgium-card-1768861394719.webp |
| Belgium | background | belgium-background-1768861394719.webp |
| Luxembourg | landmark | luxembourg-landmark-1768861394719.webp |
| Luxembourg | card | luxembourg-card-1768861394719.webp |
| Luxembourg | background | luxembourg-background-1768861394719.webp |
| Norway | landmark | norway-landmark-1768861394719.webp |
| Norway | card | norway-card-1768861394719.webp |
| Norway | background | norway-background-1768861394719.webp |
| United Kingdom | card | united-kingdom-card-1768861394719.webp |
| United Kingdom | background | united-kingdom-background-1768861394719.webp |
| United Kingdom | flag | united-kingdom-flag-1768861394719.gif |

---

## Geänderte Dateien

| Datei | Status |
|-------|--------|
| `app/api/uploads/[...path]/route.ts` | NEU |
| `app/api/upload/country-image/route.ts` | GEÄNDERT |
| `app/api/upload/news-image/route.ts` | GEÄNDERT |
| `scripts/process-new-images.ts` | NEU |
| `scripts/migrate-image-paths.ts` | NEU |
| `public/uploads/countries/` | 69 Bilder |
| `public/uploads/news/` | 2 Bilder |

---

## Rollback-Plan

Falls etwas schief geht:
1. Volume-Mount in Coolify auf `/app/public/images` zurücksetzen
2. Revert der Code-Änderungen
3. DB-Migration rückgängig machen:
   ```bash
   npx tsx scripts/migrate-image-paths.ts --reverse  # (nicht implementiert)
   ```
   Alternativ manuell in der DB:
   ```sql
   UPDATE countries SET flag_image = REPLACE(flag_image, '/api/uploads/', '/api/images/') WHERE flag_image LIKE '/api/uploads/%';
   -- etc. für alle Spalten
   ```
