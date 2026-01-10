CREATE TABLE `registrationAttempts` (
	`id` text PRIMARY KEY NOT NULL,
	`ip` text NOT NULL,
	`attemptedAt` integer NOT NULL,
	`success` integer DEFAULT false NOT NULL
);
