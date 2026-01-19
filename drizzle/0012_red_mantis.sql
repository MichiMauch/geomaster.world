CREATE TABLE `duelResults` (
	`id` text PRIMARY KEY NOT NULL,
	`duelSeed` text NOT NULL,
	`gameType` text NOT NULL,
	`challengerId` text NOT NULL,
	`challengerGameId` text NOT NULL,
	`challengerScore` integer NOT NULL,
	`challengerTime` integer NOT NULL,
	`accepterId` text NOT NULL,
	`accepterGameId` text NOT NULL,
	`accepterScore` integer NOT NULL,
	`accepterTime` integer NOT NULL,
	`winnerId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`challengerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challengerGameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accepterId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accepterGameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `duelStats` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`gameType` text NOT NULL,
	`totalDuels` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`winRate` real DEFAULT 0 NOT NULL,
	`rank` integer,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `games` ADD `duelSeed` text;