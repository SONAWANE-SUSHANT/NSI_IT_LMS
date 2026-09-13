-- Migration 002: users
-- Source table: users

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    username VARCHAR(100) GENERATED ALWAYS AS (
        CONCAT(LOWER(REPLACE(first_name, ' ', '')), '.', LOWER(REPLACE(last_name, ' ', '')), '@nsi')
    ) STORED,
    password VARCHAR(255) NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    status ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    photo VARCHAR(500) DEFAULT NULL,
    contact_no VARCHAR(20) NOT NULL,
    date_of_birth DATE DEFAULT NULL,
    gender ENUM('MALE','FEMALE','OTHER') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_username (username),
    KEY fk_users_created_by (created_by),
    KEY fk_users_updated_by (updated_by),
    KEY fk_users_role (role_id),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES user_roles (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
