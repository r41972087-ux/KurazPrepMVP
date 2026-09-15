CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`prompt` text NOT NULL,
	`options_json` text NOT NULL,
	`correct_option_id` text NOT NULL,
	`explanation` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`subject_id` text NOT NULL,
	`unit_id` text,
	`score` real NOT NULL,
	`total_questions` integer DEFAULT 0 NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`is_synced` integer DEFAULT false NOT NULL,
	`completed_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `short_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`title` text NOT NULL,
	`content_markdown` text NOT NULL,
	`is_high_yield` integer DEFAULT false NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`stream` text NOT NULL,
	`grade_level` integer NOT NULL,
	`icon` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`content_hash` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_updated` text NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_metadata_subject_id_unique` ON `sync_metadata` (`subject_id`);--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`unit_number` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
