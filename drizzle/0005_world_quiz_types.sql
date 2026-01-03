-- World Quiz Types table for dynamic world quiz categories
CREATE TABLE IF NOT EXISTS `worldQuizTypes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`name_sl` text,
	`icon` text NOT NULL,
	`center_lat` real DEFAULT 20 NOT NULL,
	`center_lng` real DEFAULT 0 NOT NULL,
	`default_zoom` integer DEFAULT 2 NOT NULL,
	`min_zoom` integer DEFAULT 1 NOT NULL,
	`timeout_penalty` integer DEFAULT 5000 NOT NULL,
	`score_scale_factor` integer DEFAULT 3000 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL
);

-- Seed with existing world quiz types
INSERT INTO `worldQuizTypes` (`id`, `name`, `name_en`, `name_sl`, `icon`, `center_lat`, `center_lng`, `default_zoom`, `min_zoom`, `timeout_penalty`, `score_scale_factor`, `is_active`, `createdAt`)
VALUES
	('highest-mountains', 'Höchste Berge', 'Highest Mountains', 'Najvišje gore', '🏔️', 20, 0, 2, 1, 5000, 3000, 1, unixepoch()),
	('capitals', 'Hauptstädte', 'World Capitals', 'Prestolnice', '🏛️', 20, 0, 2, 1, 5000, 3000, 1, unixepoch()),
	('famous-places', 'Berühmte Orte', 'Famous Places', 'Znamenite lokacije', '🗺️', 20, 0, 2, 1, 5000, 3000, 1, unixepoch()),
	('unesco', 'UNESCO Welterbe', 'UNESCO World Heritage', 'UNESCO svetovna dediščina', '🏛️', 20, 0, 2, 1, 5000, 3000, 1, unixepoch()),
	('airports', 'Internationale Flughäfen', 'International Airports', 'Mednarodna letališča', '✈️', 20, 0, 2, 1, 5000, 3000, 1, unixepoch());
