CREATE TABLE `panoramaLocations` (
	`id` text PRIMARY KEY NOT NULL,
	`mapillaryImageKey` text NOT NULL,
	`name` text NOT NULL,
	`name_de` text,
	`name_en` text,
	`name_sl` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`heading` real,
	`pitch` real,
	`countryCode` text,
	`difficulty` text DEFAULT 'medium',
	`createdAt` integer NOT NULL
);
