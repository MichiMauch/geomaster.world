-- Fix scoringVersion for existing games
-- All games created before 2025-12-25 should use v1 (distance-only) scoring
-- New ranked games will explicitly set scoringVersion=2 via application code

-- Update all existing games to use scoringVersion=1
UPDATE `games` SET `scoringVersion` = 1 WHERE `createdAt` < strftime('%s', '2025-12-25 12:00:00') * 1000;
