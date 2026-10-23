CREATE TABLE `office_events` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`agent` text NOT NULL,
	`code` text NOT NULL,
	`state` text NOT NULL,
	`count` integer NOT NULL,
	`created_at` integer NOT NULL,
	`payload_hash` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `office_events_time` ON `office_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `office_events_agent` ON `office_events` (`agent`,`created_at`);--> statement-breakpoint
CREATE TABLE `office_leases` (
	`task` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
