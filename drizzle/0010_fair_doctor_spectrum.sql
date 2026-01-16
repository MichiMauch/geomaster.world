CREATE TABLE `newsItems` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`title_en` text,
	`title_sl` text,
	`content` text NOT NULL,
	`content_en` text,
	`content_sl` text,
	`link` text,
	`link_text` text,
	`link_text_en` text,
	`link_text_sl` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `countries` ADD `card_image` text;--> statement-breakpoint
ALTER TABLE `countries` ADD `flag_image` text;