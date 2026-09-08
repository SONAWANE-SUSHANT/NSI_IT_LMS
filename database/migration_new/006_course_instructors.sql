-- Migration 006: course_instructors
-- Source table: batch_instructors

CREATE TABLE IF NOT EXISTS batch_instructors (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    batch_id INT UNSIGNED NOT NULL,
    instructor_id INT UNSIGNED NOT NULL,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT UNSIGNED DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_batch_instructor (batch_id, instructor_id),
    KEY fk_batch_instructors_instructor (instructor_id),
    KEY fk_batch_instructors_assigned_by (assigned_by),
    KEY fk_batch_instructors_updated_by (updated_by),
    CONSTRAINT fk_batch_instructors_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_batch_instructors_batch FOREIGN KEY (batch_id)
        REFERENCES batches (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_batch_instructors_instructor FOREIGN KEY (instructor_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_batch_instructors_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
