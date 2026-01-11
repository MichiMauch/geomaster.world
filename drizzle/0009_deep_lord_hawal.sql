CREATE TABLE `panoramaTypes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`name_sl` text,
	`icon` text NOT NULL,
	`landmark_image` text,
	`background_image` text,
	`center_lat` real DEFAULT 20 NOT NULL,
	`center_lng` real DEFAULT 0 NOT NULL,
	`default_zoom` integer DEFAULT 2 NOT NULL,
	`min_zoom` integer DEFAULT 1 NOT NULL,
	`timeout_penalty` integer DEFAULT 5000 NOT NULL,
	`score_scale_factor` integer DEFAULT 3000 NOT NULL,
	`default_time_limit_seconds` integer DEFAULT 60 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userStreaks` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`currentStreak` integer DEFAULT 0 NOT NULL,
	`longestStreak` integer DEFAULT 0 NOT NULL,
	`lastPlayedDate` text,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userStreaks_userId_unique` ON `userStreaks` (`userId`);