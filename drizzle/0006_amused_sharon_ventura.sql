-- Anti-cheat: Add server-side round tracking columns
ALTER TABLE `games` ADD `activeLocationIndex` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `games` ADD `locationStartedAt` integer;