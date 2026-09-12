CREATE TABLE user_devices (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id INT UNSIGNED NOT NULL,

    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(150) DEFAULT NULL,
    device_type ENUM(
        'DESKTOP',
        'LAPTOP',
        'MOBILE',
        'TABLET'
    ) DEFAULT NULL,

    browser VARCHAR(100) DEFAULT NULL,
    operating_system VARCHAR(100) DEFAULT NULL,

    last_ip_address VARCHAR(45) DEFAULT NULL,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    last_active_at TIMESTAMP NULL DEFAULT NULL,

    status ENUM('ACTIVE','REVOKED')
        NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_user_device (user_id, device_id),

    KEY idx_user_devices_user (user_id),

    CONSTRAINT fk_user_devices_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);