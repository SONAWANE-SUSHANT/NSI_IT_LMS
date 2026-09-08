-- Migration 013: quiz_options
-- Source table: quiz_options

CREATE TABLE IF NOT EXISTS quiz_options (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id INT UNSIGNED NOT NULL,
    option_label CHAR(1) NOT NULL,
    option_text VARCHAR(1000) NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_quiz_option (question_id, option_label),
    KEY fk_quiz_options_created_by (created_by),
    KEY fk_quiz_options_updated_by (updated_by),
    CONSTRAINT fk_quiz_options_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_quiz_options_question FOREIGN KEY (question_id)
        REFERENCES quiz_questions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_quiz_options_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
