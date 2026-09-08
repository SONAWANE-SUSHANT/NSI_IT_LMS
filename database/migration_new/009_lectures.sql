-- Migration 009: lectures
-- Source table: sessions

CREATE TABLE IF NOT EXISTS sessions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    module_id INT UNSIGNED NOT NULL,
    instructor_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    session_type ENUM('RECORDED','LIVE') NOT NULL DEFAULT 'LIVE',
    status ENUM('DRAFT','SCHEDULED','LIVE','COMPLETED','CANCELLED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    display_order INT NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMP NULL DEFAULT NULL,
    duration_minutes INT UNSIGNED DEFAULT NULL,
    session_url VARCHAR(1000) DEFAULT NULL,
    recording_url VARCHAR(1000) DEFAULT NULL,
    recording_provider ENUM('GOOGLE_DRIVE','S3') DEFAULT NULL,
    recording_status ENUM('NOT_AVAILABLE','AVAILABLE') NOT NULL DEFAULT 'NOT_AVAILABLE',
    published_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    KEY fk_session_module (module_id),
    KEY fk_session_instructor (instructor_id),
    KEY fk_session_created_by (created_by),
    KEY fk_session_updated_by (updated_by),
    CONSTRAINT fk_session_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_session_instructor FOREIGN KEY (instructor_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_session_module FOREIGN KEY (module_id)
        REFERENCES course_modules (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_session_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
