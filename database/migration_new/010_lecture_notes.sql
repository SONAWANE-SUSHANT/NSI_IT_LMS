-- Migration 010: lecture_notes
-- Source table: session_notes

CREATE TABLE IF NOT EXISTS session_notes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id INT UNSIGNED NOT NULL,
    title VARCHAR(250) NOT NULL,
    note_type ENUM('PDF','PPT','DOC','EXCEL','ZIP','CODE','LINK','OTHER') NOT NULL,
    file_url VARCHAR(1000) DEFAULT NULL,
    external_url VARCHAR(1000) DEFAULT NULL,
    display_order INT NOT NULL DEFAULT 0,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (id),
    KEY fk_session_notes (session_id),
    KEY fk_session_notes_created_by (created_by),
    KEY fk_session_notes_updated_by (updated_by),
    CONSTRAINT fk_session_notes FOREIGN KEY (session_id)
        REFERENCES sessions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_session_notes_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_session_notes_updated_by FOREIGN KEY (updated_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
