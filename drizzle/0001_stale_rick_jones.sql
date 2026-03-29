CREATE TABLE `chatHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employeeId` int,
	`role` enum('user','assistant') NOT NULL,
	`message` longtext NOT NULL,
	`context` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`department` varchar(100) NOT NULL,
	`position` varchar(100) NOT NULL,
	`hireDate` date NOT NULL,
	`status` enum('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
	`basicSalary` decimal(12,2) NOT NULL,
	`allowances` decimal(12,2) DEFAULT '0',
	`deductions` decimal(12,2) DEFAULT '0',
	`reportingManager` varchar(100),
	`dateOfBirth` date,
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`zipCode` varchar(20),
	`country` varchar(100),
	`profileImage` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` enum('employee_added','salary_changed','document_uploaded','leave_request','other') NOT NULL,
	`relatedEmployeeId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`month` date NOT NULL,
	`basicSalary` decimal(12,2) NOT NULL,
	`allowances` decimal(12,2) DEFAULT '0',
	`deductions` decimal(12,2) DEFAULT '0',
	`grossSalary` decimal(12,2) NOT NULL,
	`netSalary` decimal(12,2) NOT NULL,
	`status` enum('pending','processed','paid') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salaryHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`previousBasicSalary` decimal(12,2) NOT NULL,
	`newBasicSalary` decimal(12,2) NOT NULL,
	`effectiveDate` date NOT NULL,
	`reason` text,
	`changedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salaryHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `chatHistory_userId_idx` ON `chatHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `chatHistory_employeeId_idx` ON `chatHistory` (`employeeId`);--> statement-breakpoint
CREATE INDEX `documents_employeeId_idx` ON `documents` (`employeeId`);--> statement-breakpoint
CREATE INDEX `documents_type_idx` ON `documents` (`documentType`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `department_idx` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `employees` (`status`);--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `payroll_employeeId_idx` ON `payroll` (`employeeId`);--> statement-breakpoint
CREATE INDEX `payroll_month_idx` ON `payroll` (`month`);--> statement-breakpoint
CREATE INDEX `salaryHistory_employeeId_idx` ON `salaryHistory` (`employeeId`);