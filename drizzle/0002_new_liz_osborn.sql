CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` date NOT NULL,
	`checkIn` timestamp,
	`checkOut` timestamp,
	`status` enum('present','absent','late','half_day','on_leave','holiday') NOT NULL DEFAULT 'present',
	`workHours` decimal(4,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaveRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`leaveType` enum('annual','sick','casual','maternity','paternity','unpaid','other') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalDays` int NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaveRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `fileUrl` longtext NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `fileKey` longtext NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
CREATE INDEX `attendance_employeeId_idx` ON `attendance` (`employeeId`);--> statement-breakpoint
CREATE INDEX `attendance_date_idx` ON `attendance` (`date`);--> statement-breakpoint
CREATE INDEX `attendance_employeeId_date_idx` ON `attendance` (`employeeId`,`date`);--> statement-breakpoint
CREATE INDEX `leaveRequests_employeeId_idx` ON `leaveRequests` (`employeeId`);--> statement-breakpoint
CREATE INDEX `leaveRequests_status_idx` ON `leaveRequests` (`status`);--> statement-breakpoint
CREATE INDEX `leaveRequests_startDate_idx` ON `leaveRequests` (`startDate`);--> statement-breakpoint
CREATE INDEX `employees_userId_idx` ON `employees` (`userId`);