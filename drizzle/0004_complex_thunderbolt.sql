CREATE TABLE `countries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`name_sl` text,
	`icon` text NOT NULL,
	`geojson_data` text,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`default_zoom` integer DEFAULT 8 NOT NULL,
	`min_zoom` integer DEFAULT 7 NOT NULL,
	`bounds_north` real,
	`bounds_south` real,
	`bounds_east` real,
	`bounds_west` real,
	`timeout_penalty` integer DEFAULT 300 NOT NULL,
	`score_scale_factor` integer DEFAULT 80 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` text;