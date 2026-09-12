CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    attempt_id INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,

    selected_option_id INT UNSIGNED DEFAULT NULL,

    answer_text TEXT DEFAULT NULL,
    code_submission LONGTEXT DEFAULT NULL,

    is_correct TINYINT(1) DEFAULT NULL,
    marks_awarded DECIMAL(6,2) NOT NULL DEFAULT 0.00,

    answered_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_attempt_question (
        attempt_id,
        question_id
    ),

    KEY fk_attempt_answers_attempt (attempt_id),
    KEY fk_attempt_answers_question (question_id),
    KEY fk_attempt_answers_option (selected_option_id),

    CONSTRAINT fk_attempt_answers_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES quiz_attempts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attempt_answers_question
        FOREIGN KEY (question_id)
        REFERENCES quiz_questions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attempt_answers_option
        FOREIGN KEY (selected_option_id)
        REFERENCES quiz_options(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);