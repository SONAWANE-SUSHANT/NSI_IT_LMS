CREATE TABLE announcements (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    title VARCHAR(250) NOT NULL,
    message TEXT NOT NULL,

    course_id INT UNSIGNED DEFAULT NULL,
    batch_id INT UNSIGNED DEFAULT NULL,

    status ENUM('DRAFT','PUBLISHED','ARCHIVED')
        NOT NULL DEFAULT 'DRAFT',

    published_at TIMESTAMP NULL DEFAULT NULL,

    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_announcements_course (course_id),
    KEY idx_announcements_batch (batch_id),

    CONSTRAINT fk_announcements_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_announcements_batch
        FOREIGN KEY (batch_id)
        REFERENCES batches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_announcements_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_announcements_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);