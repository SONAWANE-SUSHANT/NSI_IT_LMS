CREATE TABLE session_progress (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    session_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,

    completed TINYINT(1) NOT NULL DEFAULT 0,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_session_student_progress
        (session_id, student_id),

    KEY idx_session_progress_student (student_id),

    CONSTRAINT fk_session_progress_session
        FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_session_progress_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);