CREATE TABLE course_reviews (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    course_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,

    rating TINYINT UNSIGNED NOT NULL,
    review TEXT DEFAULT NULL,

    status ENUM('ACTIVE','HIDDEN')
        NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_course_student_review
        (course_id, student_id),

    KEY idx_course_reviews_course (course_id),
    KEY idx_course_reviews_student (student_id),

    CONSTRAINT fk_course_reviews_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_course_reviews_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_course_review_rating
        CHECK (rating BETWEEN 1 AND 5)
);