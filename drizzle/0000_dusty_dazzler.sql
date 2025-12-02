CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gameRounds` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`roundNumber` integer NOT NULL,
	`locationIndex` integer DEFAULT 1 NOT NULL,
	`locationId` text NOT NULL,
	`locationSource` text DEFAULT 'locations' NOT NULL,
	`country` text DEFAULT 'switzerland' NOT NULL,
	`gameType` text,
	FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`groupId` text NOT NULL,
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
	FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `groupMembers` (
	`groupId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joinedAt` integer NOT NULL,
	PRIMARY KEY(`groupId`, `userId`),
	FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`inviteCode` text NOT NULL,
	`ownerId` text NOT NULL,
	`locationsPerRound` integer DEFAULT 5 NOT NULL,
	`timeLimitSeconds` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_inviteCode_unique` ON `groups` (`inviteCode`);--> statement-breakpoint
CREATE TABLE `guesses` (
	`id` text PRIMARY KEY NOT NULL,
	`gameRoundId` text NOT NULL,
	`userId` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`distanceKm` real NOT NULL,
	`timeSeconds` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`gameRoundId`) REFERENCES `gameRounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`country` text DEFAULT 'Switzerland',
	`difficulty` text DEFAULT 'medium',
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`hintEnabled` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verificationTokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `worldLocations` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`countryCode` text,
	`additionalInfo` text,
	`difficulty` text DEFAULT 'medium',
	`createdAt` integer NOT NULL
);
