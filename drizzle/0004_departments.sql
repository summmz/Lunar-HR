-- Migration: Add departments table
-- Departments are now managed centrally; employees reference department by name.

CREATE TABLE `departments` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT NOW(),
  `updatedAt` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  CONSTRAINT `departments_name_unique` UNIQUE(`name`)
);

-- Seed departments from existing employee data so nothing breaks
INSERT IGNORE INTO `departments` (`name`)
SELECT DISTINCT `department` FROM `employees` WHERE `department` IS NOT NULL AND `department` != '';
