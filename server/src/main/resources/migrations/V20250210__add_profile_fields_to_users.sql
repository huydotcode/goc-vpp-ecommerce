ALTER TABLE users
  ADD COLUMN first_name VARCHAR(100),
  ADD COLUMN last_name VARCHAR(100),
  ADD COLUMN phone VARCHAR(20),
  ADD COLUMN gender VARCHAR(20),
  ADD COLUMN date_of_birth DATE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_phone ON users (phone);

