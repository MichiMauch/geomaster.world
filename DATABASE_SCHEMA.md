# GeoMaster.World - Database Schema

> Drizzle ORM + Turso (SQLite)

```mermaid
erDiagram
    %% ===============================================
    %% GEOMASTER.WORLD - DATABASE SCHEMA
    %% Drizzle ORM + Turso (SQLite)
    %% ===============================================

    %% ================== AUTH ==================
    users {
        text id PK "nanoid()"
        text name
        text nickname "Display name"
        text email UK
        integer emailVerified "timestamp"
        text image
        text password "hashed"
        boolean hintEnabled "default: false"
        boolean isSuperAdmin "default: false"
    }

    accounts {
        text userId FK
        text type
        text provider PK
        text providerAccountId PK
        text refresh_token
        text access_token
        integer expires_at
        text token_type
        text scope
        text id_token
        text session_state
    }

    sessions {
        text sessionToken PK
        text userId FK
        integer expires "timestamp"
    }

    verificationTokens {
        text identifier PK
        text token PK
        integer expires "timestamp"
    }

    %% ================== GROUPS ==================
    groups {
        text id PK
        text name
        text inviteCode UK
        text ownerId FK
        integer locationsPerRound "default: 5"
        integer timeLimitSeconds "nullable"
        integer createdAt "timestamp"
    }

    groupMembers {
        text groupId PK_FK
        text userId PK_FK
        text role "admin|member"
        integer joinedAt "timestamp"
    }

    %% ================== LOCATIONS ==================
    locations {
        text id PK
        text name
        text name_de
        text name_en
        text name_sl
        real latitude
        real longitude
        text country "default: Switzerland"
        text difficulty "easy|medium|hard"
        integer createdAt "timestamp"
    }

    worldLocations {
        text id PK "nanoid()"
        text category "capitals|mountains|..."
        text name
        text name_de
        text name_en
        text name_sl
        real latitude
        real longitude
        text countryCode "ISO"
        text additionalInfo "JSON"
        text difficulty "easy|medium|hard"
        integer createdAt "timestamp"
    }

    imageLocations {
        text id PK "nanoid()"
        text imageMapId "garten|buero|..."
        text name
        text name_de
        text name_en
        text name_sl
        real x "pixel"
        real y "pixel"
        text difficulty "easy|medium|hard"
        integer createdAt "timestamp"
    }

    panoramaLocations {
        text id PK "nanoid()"
        text mapillaryImageKey
        text name "admin only"
        text name_de
        text name_en
        text name_sl
        real latitude
        real longitude
        real heading "0-360"
        real pitch "-90 to +90"
        text countryCode "ISO"
        text difficulty "easy|medium|hard"
        integer createdAt "timestamp"
    }

    %% ================== GAMES ==================
    games {
        text id PK
        text groupId FK "nullable for training"
        text userId FK "owner for training"
        text mode "group|training|ranked|duel"
        text name "optional"
        text country "legacy"
        text gameType "country:x|world:x"
        integer locationsPerRound "default: 5"
        integer timeLimitSeconds "nullable"
        integer scoringVersion "1|2"
        integer weekNumber "legacy"
        integer year "legacy"
        text status "active|completed"
        integer currentRound "default: 1"
        boolean leaderboardRevealed
        integer activeLocationIndex
        integer locationStartedAt "unix ms"
        text duelSeed "nullable"
        integer createdAt "timestamp"
    }

    gameRounds {
        text id PK
        text gameId FK
        integer roundNumber
        integer locationIndex "default: 1"
        text locationId "no FK"
        text locationSource "locations|world|image|panorama"
        text country "default: switzerland"
        text gameType "nullable"
        integer timeLimitSeconds "nullable"
    }

    guesses {
        text id PK
        text gameRoundId FK
        text userId FK
        real latitude "nullable for timeout"
        real longitude "nullable for timeout"
        real distanceKm
        integer timeSeconds "nullable"
        integer createdAt "timestamp"
    }

    %% ================== STATS & RANKINGS ==================
    userStats {
        text id PK "nanoid()"
        text userId FK
        text gameType
        integer totalGames
        integer totalRounds
        real totalDistance
        integer totalScore
        integer bestScore
        real averageDistance
        integer updatedAt "timestamp"
    }

    rankedGameResults {
        text id PK "nanoid()"
        text gameId FK
        text userId FK "nullable"
        text guestId "for anon"
        text gameType
        integer totalScore
        real averageScore
        real totalDistance
        integer completedAt "timestamp"
    }

    rankings {
        text id PK "nanoid()"
        text userId FK
        text gameType
        text period "daily|weekly|monthly|alltime"
        text periodKey
        integer totalScore
        integer totalGames
        real averageScore
        integer bestScore
        text userName
        text userImage
        integer rank "nullable"
        integer updatedAt "timestamp"
    }

    userStreaks {
        text id PK "nanoid()"
        text userId FK_UK
        integer currentStreak
        integer longestStreak
        text lastPlayedDate "date string"
        integer updatedAt "timestamp"
    }

    %% ================== DUELS ==================
    duelResults {
        text id PK "nanoid()"
        text duelSeed
        text gameType
        text challengerId FK
        text challengerGameId FK
        integer challengerScore
        integer challengerTime
        text accepterId FK
        text accepterGameId FK
        integer accepterScore
        integer accepterTime
        text winnerId FK
        integer createdAt "timestamp"
    }

    duelStats {
        text id PK "nanoid()"
        text userId FK
        text gameType
        integer totalDuels
        integer wins
        integer losses
        real winRate
        integer rank "nullable"
        integer updatedAt "timestamp"
    }

    %% ================== GAME TYPES ==================
    countries {
        text id PK "switzerland|germany|..."
        text name
        text name_en
        text name_sl
        text icon "emoji"
        text geojson_data "JSON"
        text landmark_image
        text background_image
        text card_image
        text flag_image
        real center_lat
        real center_lng
        integer default_zoom
        integer min_zoom
        real bounds_north
        real bounds_south
        real bounds_east
        real bounds_west
        integer timeout_penalty "km"
        integer score_scale_factor "km"
        boolean is_active
        integer createdAt "timestamp"
    }

    worldQuizTypes {
        text id PK "capitals|mountains|..."
        text name
        text name_en
        text name_sl
        text icon "emoji"
        text landmark_image
        text background_image
        real center_lat
        real center_lng
        integer default_zoom
        integer min_zoom
        integer timeout_penalty "km"
        integer score_scale_factor "km"
        boolean is_active
        integer createdAt "timestamp"
    }

    panoramaTypes {
        text id PK "world|..."
        text name
        text name_en
        text name_sl
        text icon "emoji"
        text landmark_image
        text background_image
        real center_lat
        real center_lng
        integer default_zoom
        integer min_zoom
        integer timeout_penalty "km"
        integer score_scale_factor "km"
        integer default_time_limit_seconds
        boolean is_active
        integer createdAt "timestamp"
    }

    %% ================== SYSTEM ==================
    activityLogs {
        text id PK "nanoid()"
        integer timestamp "timestamp"
        text level "debug|info|warn|error"
        text category "auth|game|admin|system"
        text action
        text userId FK "nullable"
        text targetId
        text targetType
        text details "JSON"
        text metadata "JSON"
    }

    newsItems {
        text id PK "nanoid()"
        text title
        text title_en
        text content
        text content_en
        text link
        text link_text
        text link_text_en
        integer createdAt "timestamp"
    }

    registrationAttempts {
        text id PK "nanoid()"
        text ip
        integer attemptedAt "timestamp"
        boolean success
    }

    notifications {
        text id PK "nanoid()"
        text userId FK
        text type
        text title
        text message
        text link
        text metadata "JSON"
        boolean isRead
        integer createdAt "timestamp"
    }

    %% ================== RELATIONSHIPS ==================

    %% Auth
    users ||--o{ accounts : "has"
    users ||--o{ sessions : "has"

    %% Groups
    users ||--o{ groups : "owns"
    users ||--o{ groupMembers : "member of"
    groups ||--o{ groupMembers : "has members"

    %% Games
    groups ||--o{ games : "has"
    users ||--o{ games : "plays (training)"
    games ||--o{ gameRounds : "consists of"
    gameRounds ||--o{ guesses : "has"
    users ||--o{ guesses : "makes"

    %% Stats & Rankings
    users ||--o{ userStats : "has"
    users ||--o{ rankedGameResults : "achieves"
    games ||--o{ rankedGameResults : "produces"
    users ||--o{ rankings : "ranked in"
    users ||--o| userStreaks : "has"

    %% Duels
    users ||--o{ duelResults : "challenges"
    users ||--o{ duelResults : "accepts"
    users ||--o{ duelResults : "wins"
    games ||--o{ duelResults : "challenger game"
    games ||--o{ duelResults : "accepter game"
    users ||--o{ duelStats : "has"

    %% System
    users ||--o{ activityLogs : "triggers"
    users ||--o{ notifications : "receives"
```
