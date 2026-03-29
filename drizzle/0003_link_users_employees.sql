ALTER TABLE employees ADD COLUMN userId INT UNIQUE NULL;
CREATE INDEX employees_userId_idx ON employees(userId);