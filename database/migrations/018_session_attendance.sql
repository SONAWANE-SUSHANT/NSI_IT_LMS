CREATE TABLE session_attendance (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    session_id INT UNSIGNED NOT NULL,
    batch_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,

    joined_at TIMESTAMP NULL DEFAULT NULL,
    left_at TIMESTAMP NULL DEFAULT NULL,

    duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,

    attendance_percentage DECIMAL(5,2)
        NOT NULL DEFAULT 0.00,

    attendance_status ENUM(
        'PRESENT',
        'ABSENT',
        'LATE',
        'PARTIAL'
    ) NOT NULL DEFAULT 'ABSENT',

    marked_by INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_session_student_attendance
        (session_id, student_id),

    KEY idx_attendance_batch (batch_id),
    KEY idx_attendance_student (student_id),

    CONSTRAINT fk_attendance_session
        FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_batch
        FOREIGN KEY (batch_id)
        REFERENCES batches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_marked_by
        FOREIGN KEY (marked_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);