-- Migration 007: course_students
-- Source table: batch_students

CREATE TABLE IF NOT EXISTS batch_students (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    batch_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('ACTIVE','INACTIVE','COMPLETED','DROPPED') NOT NULL DEFAULT 'ACTIVE',
    completion_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_batch_student (batch_id, student_id),
    KEY fk_batch_students_student (student_id),
    KEY fk_batch_students_created_by (created_by),
    KEY fk_batch_students_updated_by (updated_by),
    CONSTRAINT fk_batch_students_batch FOREIGN KEY (batch_id)
        REFERENCES batches (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_batch_students_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_batch_students_student FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_batch_students_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
