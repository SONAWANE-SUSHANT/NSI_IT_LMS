CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    quiz_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,

    attempt_number INT NOT NULL DEFAULT 1,

    status ENUM(
        'IN_PROGRESS',
        'SUBMITTED',
        'AUTO_SUBMITTED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'IN_PROGRESS',

    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL DEFAULT NULL,

    score DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    total_marks DECIMAL(6,2) NOT NULL DEFAULT 0.00,

    passed TINYINT(1) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_quiz_student_attempt (
        quiz_id,
        student_id,
        attempt_number
    ),

    KEY fk_quiz_attempts_quiz (quiz_id),
    KEY fk_quiz_attempts_student (student_id),

    CONSTRAINT fk_quiz_attempts_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_quiz_attempts_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);