CREATE TABLE `office_documents` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`operation_id` text NOT NULL
);
