-- Migration 005: course_batches
-- Source table: batches

CREATE TABLE IF NOT EXISTS batches (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    batch_code VARCHAR(100) GENERATED ALWAYS AS (
        CONCAT(
            name, '-',
            UPPER(DATE_FORMAT(start_date, '%b')), '-',
            DATE_FORMAT(start_date, '%Y')
        )
    ) STORED,
    batch_mode ENUM('ONLINE','OFFLINE','HYBRID') NOT NULL DEFAULT 'ONLINE',
    batch_time ENUM('MORNING','EVENING') NOT NULL DEFAULT 'MORNING',
    batch_schedule ENUM('WEEKDAYS','WEEKENDS') NOT NULL DEFAULT 'WEEKDAYS',
    status ENUM('UPCOMING','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_batches_code (batch_code),
    KEY fk_batches_course (course_id),
    KEY fk_batches_created_by (created_by),
    KEY fk_batches_updated_by (updated_by),
    CONSTRAINT fk_batches_course FOREIGN KEY (course_id)
        REFERENCES courses (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_batches_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_batches_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
