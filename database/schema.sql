-- ===== Drop existing tables if needed =====
DROP TABLE IF EXISTS measurements CASCADE;
DROP TABLE IF EXISTS measurement_locations CASCADE;
DROP TABLE IF EXISTS master_data CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;

-- ===== Master Data Table (Parts) =====
CREATE TABLE IF NOT EXISTS master_data (
  id SERIAL PRIMARY KEY,
  part_name VARCHAR(255) NOT NULL UNIQUE,
  part_category VARCHAR(100) NOT NULL,
  part_description TEXT,
  image_svg TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Measurement Locations Table (Multiple locations per part) =====
CREATE TABLE IF NOT EXISTS measurement_locations (
  id SERIAL PRIMARY KEY,
  master_data_id INTEGER NOT NULL REFERENCES master_data(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  location_number INTEGER NOT NULL,
  position_x DECIMAL(10, 2),
  position_y DECIMAL(10, 2),
  standard_value DECIMAL(10, 2) NOT NULL,
  tolerance_plus DECIMAL(10, 2) NOT NULL,
  tolerance_minus DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(10) DEFAULT 'mm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(master_data_id, location_number)
);

-- ===== Measurements Table =====
CREATE TABLE IF NOT EXISTS measurements (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES measurement_locations(id),
  measured_value DECIMAL(10, 2) NOT NULL,
  judgment VARCHAR(20) NOT NULL,
  is_retake BOOLEAN DEFAULT FALSE,
  original_measurement_id INTEGER REFERENCES measurements(id),
  measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Daily Reports Table =====
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  total_measurements INTEGER DEFAULT 0,
  ok_count INTEGER DEFAULT 0,
  ng_count INTEGER DEFAULT 0,
  retake_count INTEGER DEFAULT 0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Insert Sample Master Data =====
INSERT INTO master_data (part_name, part_category, part_description)
VALUES
  ('フロントドア（左）', 'ドア', '左側のフロントドア'),
  ('フロントドア（右）', 'ドア', '右側のフロントドア'),
  ('リアドア（左）', 'ドア', '左側のリアドア'),
  ('リアドア（右）', 'ドア', '右側のリアドア'),
  ('ボンネット', 'ボディ', 'エンジンルームの蓋'),
  ('トランク', 'ボディ', '荷室の蓋'),
  ('フェンダー（左前）', 'フェンダー', '左側の前輪上部'),
  ('フェンダー（右前）', 'フェンダー', '右側の前輪上部'),
  ('フェンダー（左後）', 'フェンダー', '左側の後輪上部'),
  ('フェンダー（右後）', 'フェンダー', '右側の後輪上部'),
  ('ルーフ', 'ボディ', '屋根部分');

-- ===== Insert Measurement Locations for Front Door (Left) =====
INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (1, '上辺-左', 1, 25, 15, 25.00, 0.10, 0.10, 'mm'),
  (1, '上辺-左中央', 2, 50, 15, 25.00, 0.10, 0.10, 'mm'),
  (1, '上辺-右中央', 3, 100, 15, 25.00, 0.10, 0.10, 'mm'),
  (1, '上辺-右', 4, 125, 15, 25.00, 0.10, 0.10, 'mm'),
  (1, '中央-左', 5, 15, 60, 30.00, 0.15, 0.15, 'mm'),
  (1, '中央-中央', 6, 75, 60, 30.50, 0.15, 0.15, 'mm'),
  (1, '中央-右', 7, 135, 60, 30.00, 0.15, 0.15, 'mm'),
  (1, '下辺-左', 8, 25, 105, 25.00, 0.10, 0.10, 'mm'),
  (1, '下辺-左中央', 9, 50, 105, 25.00, 0.10, 0.10, 'mm'),
  (1, '下辺-右中央', 10, 100, 105, 25.00, 0.10, 0.10, 'mm'),
  (1, '下辺-右', 11, 125, 105, 25.00, 0.10, 0.10, 'mm');

-- ===== Insert Measurement Locations for Front Door (Right) =====
INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (2, '上辺-左', 1, 25, 15, 25.00, 0.10, 0.10, 'mm'),
  (2, '上辺-左中央', 2, 50, 15, 25.00, 0.10, 0.10, 'mm'),
  (2, '上辺-右中央', 3, 100, 15, 25.00, 0.10, 0.10, 'mm'),
  (2, '上辺-右', 4, 125, 15, 25.00, 0.10, 0.10, 'mm'),
  (2, '中央-左', 5, 15, 60, 30.00, 0.15, 0.15, 'mm'),
  (2, '中央-中央', 6, 75, 60, 30.50, 0.15, 0.15, 'mm'),
  (2, '中央-右', 7, 135, 60, 30.00, 0.15, 0.15, 'mm'),
  (2, '下辺-左', 8, 25, 105, 25.00, 0.10, 0.10, 'mm'),
  (2, '下辺-左中央', 9, 50, 105, 25.00, 0.10, 0.10, 'mm'),
  (2, '下辺-右中央', 10, 100, 105, 25.00, 0.10, 0.10, 'mm'),
  (2, '下辺-右', 11, 125, 105, 25.00, 0.10, 0.10, 'mm');

-- ===== Insert Measurement Locations for Bonnet =====
INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (5, '左上', 1, 30, 25, 35.00, 0.12, 0.12, 'mm'),
  (5, '中央上', 2, 80, 25, 35.00, 0.12, 0.12, 'mm'),
  (5, '右上', 3, 130, 25, 35.00, 0.12, 0.12, 'mm'),
  (5, '左中央', 4, 30, 70, 40.00, 0.15, 0.15, 'mm'),
  (5, '中央', 5, 80, 70, 40.50, 0.15, 0.15, 'mm'),
  (5, '右中央', 6, 130, 70, 40.00, 0.15, 0.15, 'mm'),
  (5, '左下', 7, 30, 115, 35.00, 0.12, 0.12, 'mm'),
  (5, '中央下', 8, 80, 115, 35.00, 0.12, 0.12, 'mm'),
  (5, '右下', 9, 130, 115, 35.00, 0.12, 0.12, 'mm');

-- ===== Insert Measurement Locations for Trunk =====
INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (6, '左上', 1, 30, 25, 35.00, 0.12, 0.12, 'mm'),
  (6, '中央上', 2, 80, 25, 35.00, 0.12, 0.12, 'mm'),
  (6, '右上', 3, 130, 25, 35.00, 0.12, 0.12, 'mm'),
  (6, '左中央', 4, 30, 70, 40.00, 0.15, 0.15, 'mm'),
  (6, '中央', 5, 80, 70, 40.50, 0.15, 0.15, 'mm'),
  (6, '右中央', 6, 130, 70, 40.00, 0.15, 0.15, 'mm'),
  (6, '左下', 7, 30, 115, 35.00, 0.12, 0.12, 'mm'),
  (6, '中央下', 8, 80, 115, 35.00, 0.12, 0.12, 'mm'),
  (6, '右下', 9, 130, 115, 35.00, 0.12, 0.12, 'mm');

-- ===== Insert Measurement Locations for Fenders =====
INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (7, '上部', 1, 50, 20, 25.00, 0.10, 0.10, 'mm'),
  (7, '中央', 2, 50, 60, 28.00, 0.12, 0.12, 'mm'),
  (7, '下部', 3, 50, 100, 25.00, 0.10, 0.10, 'mm');

INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (8, '上部', 1, 50, 20, 25.00, 0.10, 0.10, 'mm'),
  (8, '中央', 2, 50, 60, 28.00, 0.12, 0.12, 'mm'),
  (8, '下部', 3, 50, 100, 25.00, 0.10, 0.10, 'mm');

INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (9, '上部', 1, 50, 20, 25.00, 0.10, 0.10, 'mm'),
  (9, '中央', 2, 50, 60, 28.00, 0.12, 0.12, 'mm'),
  (9, '下部', 3, 50, 100, 25.00, 0.10, 0.10, 'mm');

INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (10, '上部', 1, 50, 20, 25.00, 0.10, 0.10, 'mm'),
  (10, '中央', 2, 50, 60, 28.00, 0.12, 0.12, 'mm'),
  (10, '下部', 3, 50, 100, 25.00, 0.10, 0.10, 'mm');

-- ===== Insert Measurement Locations for Roof =====
INSERT INTO measurement_locations (master_data_id, location_name, location_number, position_x, position_y, standard_value, tolerance_plus, tolerance_minus, unit)
VALUES
  (11, '左前', 1, 30, 25, 32.00, 0.12, 0.12, 'mm'),
  (11, '中央前', 2, 80, 25, 32.00, 0.12, 0.12, 'mm'),
  (11, '右前', 3, 130, 25, 32.00, 0.12, 0.12, 'mm'),
  (11, '左後', 4, 30, 115, 32.00, 0.12, 0.12, 'mm'),
  (11, '中央後', 5, 80, 115, 32.00, 0.12, 0.12, 'mm'),
  (11, '右後', 6, 130, 115, 32.00, 0.12, 0.12, 'mm');

-- ===== Create Indexes =====
CREATE INDEX idx_measurements_location_id ON measurements(location_id);
CREATE INDEX idx_measurements_measurement_date ON measurements(measurement_date);
CREATE INDEX idx_measurement_locations_master_id ON measurement_locations(master_data_id);
