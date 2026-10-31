
-- Seed treatment catalog
INSERT INTO treatments (name, category, price, duration, description) VALUES
  ('Dental Cleaning', 'Preventive', 15000, '30 min', 'Professional teeth cleaning and polishing'),
  ('Dental Exam', 'Preventive', 10000, '20 min', 'Comprehensive oral examination'),
  ('Dental X-Ray', 'Diagnostic', 8000, '15 min', 'Digital dental radiograph'),
  ('Tooth Filling', 'Restorative', 25000, '45 min', 'Composite resin tooth filling'),
  ('Root Canal', 'Endodontic', 80000, '90 min', 'Root canal treatment'),
  ('Tooth Extraction', 'Oral Surgery', 20000, '30 min', 'Simple tooth extraction'),
  ('Wisdom Tooth Extraction', 'Oral Surgery', 50000, '60 min', 'Surgical wisdom tooth removal'),
  ('Dental Crown', 'Restorative', 120000, '60 min', 'Porcelain dental crown'),
  ('Dental Bridge', 'Restorative', 200000, '90 min', 'Fixed dental bridge'),
  ('Dental Implant', 'Implant', 350000, '120 min', 'Titanium dental implant with crown'),
  ('Teeth Whitening', 'Cosmetic', 45000, '60 min', 'Professional teeth whitening'),
  ('Orthodontic Braces', 'Orthodontic', 500000, '18 months', 'Metal orthodontic braces'),
  ('Clear Aligners', 'Orthodontic', 800000, '12 months', 'Invisible clear aligners'),
  ('Scaling & Polishing', 'Periodontic', 20000, '45 min', 'Deep cleaning for gum disease'),
  ('Gum Surgery', 'Periodontic', 100000, '90 min', 'Periodontal surgery')
ON CONFLICT DO NOTHING;

-- Seed sample patients
INSERT INTO patients (first_name, last_name, phone, email, gender, date_of_birth, address, blood_group, status) VALUES
  ('Adebayo', 'Okonkwo', '08012345678', 'adebayo@email.com', 'Male', '1985-03-15', '12 Marina St, Lagos', 'O+', 'active'),
  ('Chioma', 'Eze', '08023456789', 'chioma@email.com', 'Female', '1992-07-22', '5 Broad St, Lagos', 'A+', 'active'),
  ('Emeka', 'Nwosu', '08034567890', 'emeka@email.com', 'Male', '1978-11-30', '8 Allen Ave, Ikeja', 'B+', 'active'),
  ('Funke', 'Adeyemi', '08045678901', 'funke@email.com', 'Female', '1990-01-10', '22 Bode Thomas, Surulere', 'AB+', 'active'),
  ('Ibrahim', 'Mohammed', '08056789012', 'ibrahim@email.com', 'Male', '2000-05-05', '3 Ahmadu Bello Way, VI', 'O-', 'active')
ON CONFLICT DO NOTHING;

-- Seed staff members (these are NOT auth users, just staff records)
INSERT INTO staff (full_name, role, specialty, email, phone, status) VALUES
  ('Dr. Amara Okeke', 'dentist', 'General Dentistry', 'amara@vistadental.com', '08011111111', 'active'),
  ('Dr. Chukwu Obi', 'dentist', 'Orthodontics', 'chukwu@vistadental.com', '08022222222', 'active'),
  ('Ngozi Adekunle', 'hygienist', 'Periodontics', 'ngozi@vistadental.com', '08033333333', 'active'),
  ('Tunde Balogun', 'assistant', NULL, 'tunde@vistadental.com', '08044444444', 'active'),
  ('Aisha Yusuf', 'receptionist', NULL, 'aisha@vistadental.com', '08055555555', 'active'),
  ('Olumide Fasanya', 'accountant', NULL, 'olumide@vistadental.com', '08066666666', 'active')
ON CONFLICT DO NOTHING;
