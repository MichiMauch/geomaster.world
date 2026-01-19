-- Notifications table for in-app notifications
CREATE TABLE `notifications` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `message` text NOT NULL,
  `link` text,
  `metadata` text,
  `isRead` integer DEFAULT 0 NOT NULL,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Index for fast lookup by user
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);

-- Index for unread notifications lookup
CREATE INDEX `notifications_userId_isRead_idx` ON `notifications` (`userId`, `isRead`);
