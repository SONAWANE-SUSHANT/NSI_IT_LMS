-- Migration 012: quiz_questions
-- Source table: quiz_questions

CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    quiz_id INT UNSIGNED NOT NULL,
    question_type ENUM('MCQ','CODING') NOT NULL,
    question_text TEXT NOT NULL,
    marks DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    display_order INT NOT NULL DEFAULT 1,
    difficulty ENUM('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
    explanation TEXT,
    programming_language VARCHAR(50) DEFAULT NULL,
    starter_code TEXT,
    constraints TEXT,
    expected_output TEXT,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    KEY fk_quiz_questions_quiz (quiz_id),
    KEY fk_quiz_questions_created_by (created_by),
    KEY fk_quiz_questions_updated_by (updated_by),
    CONSTRAINT fk_quiz_questions_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_quiz_questions_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
