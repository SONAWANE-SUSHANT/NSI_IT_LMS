-- Migration 011: quizzes
-- Source table: quizzes

CREATE TABLE IF NOT EXISTS quizzes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id INT UNSIGNED NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    instructions TEXT,
    duration_minutes INT DEFAULT NULL,
    total_marks DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    passing_marks DECIMAL(6,2) DEFAULT NULL,
    max_attempts INT NOT NULL DEFAULT 1,
    status ENUM('DRAFT','PUBLISHED','CLOSED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    available_from TIMESTAMP NULL DEFAULT NULL,
    available_until TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    KEY fk_quizzes_sessions (session_id),
    KEY fk_quizzes_created_by (created_by),
    KEY fk_quizzes_updated_by (updated_by),
    CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_quizzes_sessions FOREIGN KEY (session_id)
        REFERENCES sessions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_quizzes_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
