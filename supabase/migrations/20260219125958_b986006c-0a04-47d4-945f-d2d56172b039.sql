
-- Seed default revenue allocation rules for Clinexus org
INSERT INTO revenue_allocation_rules (org_id, category, percentage, is_active) VALUES
('911362d9-4578-4302-8aae-235239c3fdc3', 'Direct Costs', 30, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Base Operations', 25, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Volume Bonus Pool', 15, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Clinical Savings', 15, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Investors', 10, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Tithe', 5, true);

-- Seed default staff allocation rules
INSERT INTO staff_allocation_rules (org_id, category, percentage, is_active) VALUES
('911362d9-4578-4302-8aae-235239c3fdc3', 'Lead Dentist', 35, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Associate Dentist', 25, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Hygienist', 15, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Receptionist', 10, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Admin/Manager', 15, true);

-- Seed default lab allocation rules
INSERT INTO lab_allocation_rules (org_id, category, percentage, is_active) VALUES
('911362d9-4578-4302-8aae-235239c3fdc3', 'Materials & Supplies', 40, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Technician Fees', 30, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Equipment Maintenance', 15, true),
('911362d9-4578-4302-8aae-235239c3fdc3', 'Overhead & Profit', 15, true);
