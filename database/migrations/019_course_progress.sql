CREATE TABLE course_progress (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    course_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,

    completion_percentage DECIMAL(5,2)
        NOT NULL DEFAULT 0.00,

    completed_sessions INT UNSIGNED NOT NULL DEFAULT 0,
    total_sessions INT UNSIGNED NOT NULL DEFAULT 0,

    completed TINYINT(1) NOT NULL DEFAULT 0,

    completed_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_course_student_progress
        (course_id, student_id),

    KEY idx_course_progress_student (student_id),

    CONSTRAINT fk_course_progress_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_course_progress_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);