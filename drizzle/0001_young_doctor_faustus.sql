CREATE TABLE `imageLocations` (
	`id` text PRIMARY KEY NOT NULL,
	`imageMapId` text NOT NULL,
	`name` text NOT NULL,
	`name_de` text,
	`name_en` text,
	`name_sl` text,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`difficulty` text DEFAULT 'medium',
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rankedGameResults` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`userId` text,
	`guestId` text,
	`gameType` text NOT NULL,
	`totalScore` integer NOT NULL,
	`averageScore` real NOT NULL,
	`totalDistance` real NOT NULL,
	`completedAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`gameType` text NOT NULL,
	`period` text NOT NULL,
	`periodKey` text NOT NULL,
	`totalScore` integer DEFAULT 0 NOT NULL,
	`totalGames` integer DEFAULT 0 NOT NULL,
	`averageScore` real DEFAULT 0 NOT NULL,
	`bestScore` integer DEFAULT 0 NOT NULL,
	`userName` text,
	`userImage` text,
	`rank` integer,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `userStats` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`gameType` text NOT NULL,
	`totalGames` integer DEFAULT 0 NOT NULL,
	`totalRounds` integer DEFAULT 0 NOT NULL,
	`totalDistance` real DEFAULT 0 NOT NULL,
	`totalScore` integer DEFAULT 0 NOT NULL,
	`bestScore` integer DEFAULT 0 NOT NULL,
	`averageDistance` real DEFAULT 0 NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` text PRIMARY KEY NOT NULL,
	`groupId` text,
	`userId` text,
	`mode` text DEFAULT 'group' NOT NULL,
	`name` text,
	`country` text DEFAULT 'switzerland' NOT NULL,
	`gameType` text,
	`locationsPerRound` integer DEFAULT 5 NOT NULL,
	`timeLimitSeconds` integer,
	`weekNumber` integer,
	`year` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`currentRound` integer DEFAULT 1 NOT NULL,
	`leaderboardRevealed` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "groupId", "userId", "mode", "name", "country", "gameType", "locationsPerRound", "timeLimitSeconds", "weekNumber", "year", "status", "currentRound", "leaderboardRevealed", "createdAt") SELECT "id", "groupId", "userId", "mode", "name", "country", "gameType", "locationsPerRound", "timeLimitSeconds", "weekNumber", "year", "status", "currentRound", "leaderboardRevealed", "createdAt" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `gameRounds` ADD `timeLimitSeconds` integer;--> statement-breakpoint
ALTER TABLE `locations` ADD `name_de` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `name_en` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `name_sl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuperAdmin` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `worldLocations` ADD `name_de` text;--> statement-breakpoint
ALTER TABLE `worldLocations` ADD `name_en` text;--> statement-breakpoint
ALTER TABLE `worldLocations` ADD `name_sl` text;