DROP INDEX "groups_inviteCode_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `games` ALTER COLUMN "scoringVersion" TO "scoringVersion" integer NOT NULL DEFAULT 1;--> statement-breakpoint
CREATE UNIQUE INDEX `groups_inviteCode_unique` ON `groups` (`inviteCode`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;