-- ============================================
-- ADAPTIVE TRAFFIC LIGHT MONITORING SYSTEM
-- Database Schema (SQL Format)
-- ============================================

-- ============================================
-- 1. TABLE: users
-- Menyimpan data pengguna sistem
-- ============================================
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin_pusat', 'operator_lapangan') NOT NULL,
    phone VARCHAR(20),
    photo_url TEXT,
    location VARCHAR(255),
    status ENUM('active', 'inactive', 'offline') DEFAULT 'active',
    reports_created INTEGER DEFAULT 0,
    reports_completed INTEGER DEFAULT 0,
    active_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- 2. TABLE: intersections
-- Menyimpan data persimpangan
-- ============================================
CREATE TABLE intersections (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    lanes_count INTEGER NOT NULL,
    lanes_directions JSON,
    config_mode ENUM('auto', 'manual') DEFAULT 'auto',
    threshold_low INTEGER DEFAULT 50,
    threshold_medium INTEGER DEFAULT 100,
    threshold_high INTEGER DEFAULT 200,
    threshold_critical INTEGER DEFAULT 300,
    alert_enabled BOOLEAN DEFAULT TRUE,
    cycle_time_min INTEGER DEFAULT 30,
    cycle_time_max INTEGER DEFAULT 120,
    cctv_enabled BOOLEAN DEFAULT FALSE,
    cctv_stream_url TEXT,
    cctv_recording_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_update TIMESTAMP
);

-- ============================================
-- 3. TABLE: traffic_data
-- Menyimpan data lalu lintas real-time
-- ============================================
CREATE TABLE traffic_data (
    id VARCHAR(255) PRIMARY KEY,
    intersection_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    north_vehicle_count INTEGER,
    north_speed DECIMAL(5, 2),
    north_density DECIMAL(5, 2),
    north_queue_length DECIMAL(6, 2),
    north_light_status ENUM('red', 'yellow', 'green'),
    north_green_time INTEGER,
    east_vehicle_count INTEGER,
    east_speed DECIMAL(5, 2),
    east_density DECIMAL(5, 2),
    east_queue_length DECIMAL(6, 2),
    east_light_status ENUM('red', 'yellow', 'green'),
    east_green_time INTEGER,
    south_vehicle_count INTEGER,
    south_speed DECIMAL(5, 2),
    south_density DECIMAL(5, 2),
    south_queue_length DECIMAL(6, 2),
    south_light_status ENUM('red', 'yellow', 'green'),
    south_green_time INTEGER,
    west_vehicle_count INTEGER,
    west_speed DECIMAL(5, 2),
    west_density DECIMAL(5, 2),
    west_queue_length DECIMAL(6, 2),
    west_light_status ENUM('red', 'yellow', 'green'),
    west_green_time INTEGER,
    total_vehicles INTEGER NOT NULL,
    average_speed DECIMAL(5, 2),
    congestion_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    congestion_index INTEGER,
    density DECIMAL(5, 2),
    vc_ratio DECIMAL(4, 2),
    cycle_time INTEGER,
    wait_time INTEGER,
    temperature DECIMAL(4, 1),
    humidity DECIMAL(4, 1),
    weather VARCHAR(50),
    visibility INTEGER,
    ai_prediction ENUM('increasing', 'stable', 'decreasing'),
    ai_confidence DECIMAL(3, 2),
    ai_recommendation TEXT,
    FOREIGN KEY (intersection_id) REFERENCES intersections(id) ON DELETE CASCADE,
    INDEX idx_intersection_timestamp (intersection_id, timestamp),
    INDEX idx_timestamp (timestamp),
    INDEX idx_congestion_level (congestion_level)
);

-- ============================================
-- 4. TABLE: events
-- Menyimpan kejadian & anomali
-- ============================================
CREATE TABLE events (
    id VARCHAR(255) PRIMARY KEY,
    intersection_id VARCHAR(255) NOT NULL,
    type ENUM('congestion', 'accident', 'sensor_error', 'manual_override', 'system_alert', 'maintenance') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    reported_by_user_id VARCHAR(255),
    reported_by_user_name VARCHAR(255),
    reported_by_user_role VARCHAR(50),
    assigned_to_user_id VARCHAR(255),
    assigned_to_user_name VARCHAR(255),
    location_lane VARCHAR(50),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    vehicle_count INTEGER,
    congestion_level VARCHAR(50),
    duration INTEGER,
    affected_lanes JSON,
    images JSON,
    actions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intersection_id) REFERENCES intersections(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_intersection_status (intersection_id, status),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_timestamp (timestamp)
);

-- ============================================
-- 5. TABLE: reports
-- Menyimpan laporan pengguna
-- ============================================
CREATE TABLE reports (
    id VARCHAR(255) PRIMARY KEY,
    intersection_id VARCHAR(255) NOT NULL,
    type ENUM('congestion', 'accident', 'sensor_malfunction', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    status ENUM('submitted', 'reviewed', 'in_progress', 'completed', 'rejected') DEFAULT 'submitted',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reported_by_user_id VARCHAR(255) NOT NULL,
    reported_by_user_name VARCHAR(255) NOT NULL,
    reported_by_user_email VARCHAR(255) NOT NULL,
    reported_by_user_role VARCHAR(50) NOT NULL,
    attachments JSON,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    reviewed_by_user_id VARCHAR(255),
    reviewed_by_user_name VARCHAR(255),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP,
    solution TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intersection_id) REFERENCES intersections(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_intersection (intersection_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_reported_by (reported_by_user_id),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 6. TABLE: notifications
-- Menyimpan notifikasi pengguna
-- ============================================
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type ENUM('alert', 'info', 'warning', 'success') NOT NULL,
    category ENUM('traffic', 'system', 'report', 'maintenance') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    `read` BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    related_to_type ENUM('intersection', 'event', 'report'),
    related_to_id VARCHAR(255),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, `read`),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 7. TABLE: analytics_daily
-- Menyimpan agregasi data harian
-- ============================================
CREATE TABLE analytics_daily (
    id VARCHAR(255) PRIMARY KEY,
    intersection_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_vehicles INTEGER,
    average_speed DECIMAL(5, 2),
    average_congestion_index DECIMAL(5, 2),
    average_wait_time DECIMAL(6, 2),
    peak_hour VARCHAR(5),
    peak_vehicle_count INTEGER,
    hourly_data JSON,
    auto_mode_time INTEGER,
    manual_mode_time INTEGER,
    auto_mode_efficiency DECIMAL(5, 2),
    manual_mode_efficiency DECIMAL(5, 2),
    total_events INTEGER,
    events_low INTEGER,
    events_medium INTEGER,
    events_high INTEGER,
    events_critical INTEGER,
    events_congestion INTEGER,
    events_accident INTEGER,
    events_sensor_error INTEGER,
    events_other INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intersection_id) REFERENCES intersections(id) ON DELETE CASCADE,
    UNIQUE KEY unique_intersection_date (intersection_id, date),
    INDEX idx_date (date)
);

-- ============================================
-- 8. TABLE: system_config
-- Menyimpan konfigurasi sistem global
-- ============================================
CREATE TABLE system_config (
    id VARCHAR(255) PRIMARY KEY DEFAULT 'global_config',
    auto_mode BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    dark_mode BOOLEAN DEFAULT FALSE,
    mqtt_broker_url VARCHAR(255),
    api_key TEXT,
    connection_timeout INTEGER DEFAULT 30,
    heartbeat_interval INTEGER DEFAULT 60,
    congestion_threshold INTEGER DEFAULT 70,
    response_time INTEGER DEFAULT 15,
    escalation_time INTEGER DEFAULT 30,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    scheduled_downtime_start TIMESTAMP,
    scheduled_downtime_end TIMESTAMP,
    scheduled_downtime_reason TEXT,
    last_maintenance TIMESTAMP,
    next_maintenance TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 9. TABLE: device_status
-- Menyimpan status perangkat IoT
-- ============================================
CREATE TABLE device_status (
    id VARCHAR(255) PRIMARY KEY,
    intersection_id VARCHAR(255) NOT NULL,
    status ENUM('online', 'offline', 'error') DEFAULT 'offline',
    last_heartbeat TIMESTAMP,
    hardware_model VARCHAR(100),
    firmware_version VARCHAR(50),
    uptime INTEGER,
    free_memory BIGINT,
    cpu_usage DECIMAL(5, 2),
    signal_strength INTEGER,
    ip_address VARCHAR(45),
    latency INTEGER,
    packet_loss DECIMAL(5, 2),
    sensors JSON,
    errors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intersection_id) REFERENCES intersections(id) ON DELETE CASCADE,
    INDEX idx_intersection (intersection_id),
    INDEX idx_status (status),
    INDEX idx_last_heartbeat (last_heartbeat)
);

-- ============================================
-- 10. TABLE: audit_logs
-- Menyimpan log aktivitas sistem
-- ============================================
CREATE TABLE audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action ENUM('create', 'update', 'delete', 'login', 'logout') NOT NULL,
    resource ENUM('user', 'intersection', 'report', 'config', 'event') NOT NULL,
    resource_id VARCHAR(255),
    details_before JSON,
    details_after JSON,
    changes JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource),
    INDEX idx_timestamp (timestamp)
);

-- ============================================
-- SAMPLE DATA / SEED DATA
-- ============================================

-- Insert Sample Users
INSERT INTO users (id, email, name, role, phone, status) VALUES
('user_001', 'admin@traffic.com', 'Admin Pusat', 'admin_pusat', '081234567890', 'active'),
('user_002', 'operator1@traffic.com', 'Operator Lapangan 1', 'operator_lapangan', '081234567891', 'active'),
('user_003', 'operator2@traffic.com', 'Operator Lapangan 2', 'operator_lapangan', '081234567892', 'active'),
('user_004', 'admin2@traffic.com', 'Admin Pusat 2', 'admin_pusat', '081234567893', 'offline');

-- Insert Sample Intersections
INSERT INTO intersections (id, name, address, latitude, longitude, device_id, status, lanes_count, lanes_directions, config_mode) VALUES
('int_001', 'Simpang Empat Diponegoro', 'Jl. Diponegoro No. 123, Jakarta Pusat', -6.2088, 106.8456, 'ESP32_001', 'active', 4, '["north", "east", "south", "west"]', 'auto'),
('int_002', 'Simpang Tiga Sudirman', 'Jl. Sudirman No. 456, Jakarta Selatan', -6.2215, 106.8145, 'ESP32_002', 'active', 3, '["north", "east", "south"]', 'auto'),
('int_003', 'Simpang Empat Thamrin', 'Jl. Thamrin No. 789, Jakarta Pusat', -6.1944, 106.8229, 'ESP32_003', 'active', 4, '["north", "east", "south", "west"]', 'manual'),
('int_004', 'Simpang Empat Gatot Subroto', 'Jl. Gatot Subroto No. 321, Jakarta Selatan', -6.2297, 106.8109, 'ESP32_004', 'maintenance', 4, '["north", "east", "south", "west"]', 'auto');

-- Insert Sample Traffic Data
INSERT INTO traffic_data (id, intersection_id, device_id, timestamp, north_vehicle_count, north_speed, north_density, north_queue_length, north_light_status, north_green_time, east_vehicle_count, east_speed, east_density, east_queue_length, east_light_status, east_green_time, south_vehicle_count, south_speed, south_density, south_queue_length, south_light_status, south_green_time, west_vehicle_count, west_speed, west_density, west_queue_length, west_light_status, west_green_time, total_vehicles, average_speed, congestion_level, congestion_index, density, vc_ratio, cycle_time, wait_time, temperature, humidity, weather) VALUES
('td_001', 'int_001', 'ESP32_001', '2026-04-15 10:30:00', 45, 35.5, 25.3, 50.0, 'green', 45, 38, 32.0, 22.5, 45.0, 'red', 0, 42, 30.5, 28.0, 55.0, 'red', 0, 40, 33.0, 24.0, 48.0, 'red', 0, 165, 32.75, 'medium', 55, 24.95, 0.65, 90, 35, 28.5, 65.0, 'Cerah'),
('td_002', 'int_001', 'ESP32_001', '2026-04-15 10:35:00', 52, 28.0, 32.0, 65.0, 'red', 0, 45, 30.0, 28.0, 55.0, 'green', 45, 48, 25.0, 35.0, 70.0, 'red', 0, 43, 29.0, 30.0, 60.0, 'red', 0, 188, 28.0, 'high', 72, 31.25, 0.78, 90, 45, 29.0, 63.0, 'Cerah'),
('td_003', 'int_002', 'ESP32_002', '2026-04-15 10:30:00', 35, 40.0, 18.0, 30.0, 'green', 40, 32, 38.0, 16.0, 28.0, 'red', 0, 30, 42.0, 15.0, 25.0, 'red', 0, NULL, NULL, NULL, NULL, NULL, NULL, 97, 40.0, 'low', 35, 16.33, 0.45, 75, 20, 27.0, 68.0, 'Cerah');

-- Insert Sample Events
INSERT INTO events (id, intersection_id, type, priority, status, title, description, timestamp, reported_by_user_id, reported_by_user_name, reported_by_user_role, location_lane) VALUES
('evt_001', 'int_001', 'congestion', 'high', 'open', 'Kemacetan Parah Jalur Utara', 'Antrian kendaraan mencapai 100 meter', '2026-04-15 10:25:00', 'user_002', 'Operator Lapangan 1', 'operator_lapangan', 'north'),
('evt_002', 'int_002', 'sensor_error', 'medium', 'in_progress', 'Sensor Jalur Timur Error', 'Sensor tidak mendeteksi kendaraan', '2026-04-15 09:15:00', 'user_002', 'Operator Lapangan 1', 'operator_lapangan', 'east'),
('evt_003', 'int_003', 'manual_override', 'low', 'resolved', 'Manual Override Diaktifkan', 'Operator mengambil alih kontrol lampu', '2026-04-15 08:00:00', 'user_003', 'Operator Lapangan 2', 'operator_lapangan', NULL);

-- Insert Sample Reports
INSERT INTO reports (id, intersection_id, type, priority, status, title, description, reported_by_user_id, reported_by_user_name, reported_by_user_email, reported_by_user_role) VALUES
('rpt_001', 'int_001', 'congestion', 'high', 'submitted', 'Kemacetan Pagi Hari', 'Kemacetan terjadi setiap pagi jam 07:00-09:00', 'user_002', 'Operator Lapangan 1', 'operator1@traffic.com', 'operator_lapangan'),
('rpt_002', 'int_004', 'sensor_malfunction', 'critical', 'reviewed', 'Sensor Mati Total', 'Semua sensor di persimpangan tidak berfungsi', 'user_003', 'Operator Lapangan 2', 'operator2@traffic.com', 'operator_lapangan'),
('rpt_003', 'int_002', 'accident', 'high', 'in_progress', 'Kecelakaan Kendaraan', 'Tabrakan 2 mobil di jalur selatan', 'user_002', 'Operator Lapangan 1', 'operator1@traffic.com', 'operator_lapangan');

-- Insert Sample Notifications
INSERT INTO notifications (id, user_id, type, category, title, message, `read`, related_to_type, related_to_id) VALUES
('notif_001', 'user_001', 'alert', 'traffic', 'Kemacetan Parah', 'Kemacetan parah terdeteksi di Simpang Empat Diponegoro', FALSE, 'event', 'evt_001'),
('notif_002', 'user_001', 'warning', 'system', 'Sensor Error', 'Sensor di Simpang Tiga Sudirman mengalami error', FALSE, 'event', 'evt_002'),
('notif_003', 'user_002', 'info', 'report', 'Laporan Direview', 'Laporan Anda telah direview oleh admin', TRUE, 'report', 'rpt_002'),
('notif_004', 'user_001', 'success', 'maintenance', 'Maintenance Selesai', 'Maintenance di Simpang Empat Gatot Subroto selesai', TRUE, 'intersection', 'int_004');

-- Insert Sample Analytics Daily
INSERT INTO analytics_daily (id, intersection_id, date, total_vehicles, average_speed, average_congestion_index, average_wait_time, peak_hour, peak_vehicle_count, auto_mode_time, manual_mode_time, auto_mode_efficiency, manual_mode_efficiency, total_events, events_low, events_medium, events_high, events_critical, events_congestion, events_accident, events_sensor_error, events_other) VALUES
('int_001_2026-04-15', 'int_001', '2026-04-15', 12500, 32.5, 58.3, 42.5, '08:00', 850, 1380, 60, 92.5, 75.0, 8, 2, 3, 2, 1, 3, 1, 2, 2),
('int_002_2026-04-15', 'int_002', '2026-04-15', 8200, 38.0, 42.0, 28.0, '17:00', 620, 1440, 0, 95.0, 0.0, 3, 1, 1, 1, 0, 1, 0, 1, 1),
('int_001_2026-04-14', 'int_001', '2026-04-14', 11800, 35.0, 52.0, 38.0, '08:00', 820, 1320, 120, 93.0, 78.0, 5, 2, 2, 1, 0, 2, 0, 1, 2);

-- Insert System Config
INSERT INTO system_config (id, auto_mode, notifications_enabled, dark_mode, mqtt_broker_url, connection_timeout, heartbeat_interval, congestion_threshold, response_time, escalation_time, email_enabled, sms_enabled, updated_by) VALUES
('global_config', TRUE, TRUE, FALSE, 'mqtt://broker.hivemq.com:1883', 30, 60, 70, 15, 30, TRUE, FALSE, 'user_001');

-- Insert Device Status
INSERT INTO device_status (id, intersection_id, status, last_heartbeat, hardware_model, firmware_version, uptime, free_memory, cpu_usage, signal_strength, ip_address, latency, packet_loss) VALUES
('ESP32_001', 'int_001', 'online', '2026-04-15 10:35:00', 'ESP32-WROOM-32', 'v2.1.5', 345600, 102400, 45.5, -65, '192.168.1.101', 25, 0.5),
('ESP32_002', 'int_002', 'online', '2026-04-15 10:34:00', 'ESP32-WROOM-32', 'v2.1.5', 432000, 98304, 38.2, -58, '192.168.1.102', 18, 0.2),
('ESP32_003', 'int_003', 'online', '2026-04-15 10:35:00', 'ESP32-WROOM-32', 'v2.1.4', 518400, 110592, 52.0, -72, '192.168.1.103', 35, 1.2),
('ESP32_004', 'int_004', 'offline', '2026-04-15 08:00:00', 'ESP32-WROOM-32', 'v2.1.3', 0, 0, 0.0, 0, NULL, 0, 0.0);

-- Insert Sample Audit Logs
INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, ip_address, timestamp) VALUES
('log_001', 'user_001', 'Admin Pusat', 'admin_pusat', 'create', 'intersection', 'int_004', '192.168.1.50', '2026-04-15 08:00:00'),
('log_002', 'user_002', 'Operator Lapangan 1', 'operator_lapangan', 'create', 'report', 'rpt_001', '192.168.1.51', '2026-04-15 09:30:00'),
('log_003', 'user_001', 'Admin Pusat', 'admin_pusat', 'update', 'config', 'global_config', '192.168.1.50', '2026-04-15 10:00:00'),
('log_004', 'user_003', 'Operator Lapangan 2', 'operator_lapangan', 'create', 'event', 'evt_003', '192.168.1.52', '2026-04-15 08:05:00');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes
CREATE INDEX idx_traffic_data_intersection_congestion ON traffic_data(intersection_id, congestion_level);
CREATE INDEX idx_events_intersection_priority ON events(intersection_id, priority);
CREATE INDEX idx_reports_status_priority ON reports(status, priority);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ============================================
-- END OF SCHEMA
-- ============================================
