
-- STAFF
insert into staff (org_id, full_name, role, phone, email, specialty, status) values
('2538a150-279d-422d-843f-d72c89d6f242','Dr. Adaeze Okonkwo','ophthalmologist','+2348031234501','adaeze@eyedemo.ng','Cataract & Anterior Segment','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Dr. Femi Bakare','ophthalmologist','+2348031234502','femi@eyedemo.ng','Glaucoma','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Dr. Nneka Eze','optometrist','+2348031234503','nneka@eyedemo.ng','Paediatric Optometry','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Tunde Adeyemi','optometrist','+2348031234504','tunde@eyedemo.ng','Contact Lenses','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Grace Uche','optician','+2348031234505','grace@eyedemo.ng','Dispensing','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Ibrahim Musa','technician','+2348031234506','ibrahim@eyedemo.ng','Imaging & Diagnostics','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Blessing Ali','nurse','+2348031234507','blessing@eyedemo.ng','Theatre Nurse','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Chioma Nwosu','receptionist','+2348031234508','chioma@eyedemo.ng','Front Desk','active');

-- SERVICES
insert into treatments (org_id, name, category, price, duration, description, status) values
('2538a150-279d-422d-843f-d72c89d6f242','Comprehensive Eye Examination','Consultation',15000,40,'Full refraction and ocular health check','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Follow-up Consultation','Consultation',8000,20,'Review visit','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Refraction Only','Consultation',7000,20,'Spectacle prescription','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Paediatric Eye Assessment','Consultation',18000,45,'Children vision assessment','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Glaucoma Screening','Diagnostics',20000,30,'IOP, disc and field assessment','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Visual Field Test','Diagnostics',25000,30,'Humphrey perimetry','active'),
('2538a150-279d-422d-843f-d72c89d6f242','OCT Macula Scan','Diagnostics',35000,25,'Optical coherence tomography','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Fundus Photography','Diagnostics',20000,20,'Retinal imaging','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Biometry (IOL Master)','Diagnostics',30000,25,'Pre-cataract biometry','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Contact Lens Fitting','Optical',30000,45,'Fitting and training','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Dry Eye Treatment','Procedure',22000,30,'Punctal and lid therapy','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Foreign Body Removal','Procedure',18000,20,'Corneal foreign body removal','active'),
('2538a150-279d-422d-843f-d72c89d6f242','YAG Laser Capsulotomy','Surgery',120000,30,'Posterior capsule opacification','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Cataract Surgery (Phaco + IOL)','Surgery',450000,60,'Phacoemulsification with IOL','active'),
('2538a150-279d-422d-843f-d72c89d6f242','Pterygium Excision','Surgery',180000,45,'Excision with conjunctival graft','active');

-- PATIENTS
insert into patients (org_id, first_name, last_name, date_of_birth, gender, phone, email, blood_group, allergies, medical_history, emergency_contact_name, emergency_contact_phone, referral_source, address, status, occupation, created_at)
with d as (
  select array['Ada','Chidi','Emeka','Ngozi','Tunde','Bola','Yusuf','Amina','Kelechi','Ifeoma','Segun','Halima','Obinna','Funke','Musa','Zainab','Peter','Grace','Samuel','Blessing','Uche','Kemi','Ibrahim','Chinwe']::text[] fn,
  array['Okafor','Adeyemi','Balogun','Eze','Nwosu','Bello','Okonkwo','Lawal','Ibrahim','Ogunleye','Uzoma','Danjuma','Afolabi','Chukwu','Mohammed','Adebayo','Nnamdi','Olawale']::text[] ln,
  array['Walk-in','Referral','Instagram','Google','Friend','HMO','Health Camp']::text[] rs,
  array['A+','O+','B+','AB+','O-','A-']::text[] bg,
  array['Teacher','Trader','Engineer','Student','Civil Servant','Driver','Nurse','Banker','Farmer','Tailor','Accountant','Retired']::text[] oc,
  array['Diabetes mellitus type 2','Hypertension','No significant history','Asthma','Family history of glaucoma','Previous cataract surgery (left eye)','Thyroid disease']::text[] mh,
  array['None','Penicillin','Dust','Sulfa drugs','None','Pollen']::text[] al,
  array['12 Awolowo Road, Ikoyi, Lagos','5 Ogui Road, Enugu','24 Ahmadu Bello Way, Abuja','8 Aba Road, Port Harcourt','17 Adeniran Ogunsanya, Surulere, Lagos','3 Zoo Road, Kano','41 Ring Road, Ibadan']::text[] ad
)
select '2538a150-279d-422d-843f-d72c89d6f242',
  fn[1+((i*7)%24)], ln[1+((i*13)%18)],
  (current_date - (5200 + (i*197)%22000))::date,
  case when i%2=0 then 'Male' else 'Female' end,
  '+23480'||lpad(((i*7919)%10000000)::text,7,'0'),
  lower(fn[1+((i*7)%24)])||'.'||lower(ln[1+((i*13)%18)])||i||'@example.com',
  bg[1+(i%6)], al[1+(i%6)], mh[1+(i%7)],
  fn[1+((i*5)%24)]||' '||ln[1+((i*13)%18)], '+23470'||lpad(((i*3313)%10000000)::text,7,'0'),
  rs[1+(i%7)], ad[1+(i%7)], case when i%37=0 then 'inactive' else 'active' end, oc[1+(i%12)],
  now() - ((380 - (i*380/240))||' days')::interval
from generate_series(1,240) i, d;

-- APPOINTMENTS (past year + upcoming)
insert into appointments (org_id, patient_id, staff_id, treatment_id, appointment_date, appointment_time, chair, status, is_walk_in, notes, created_at)
with pt as (select id, row_number() over (order by created_at, id) rn, count(*) over () c from patients where org_id='2538a150-279d-422d-843f-d72c89d6f242'),
st as (select id, row_number() over (order by created_at, id) rn, count(*) over () c from staff where org_id='2538a150-279d-422d-843f-d72c89d6f242' and role in ('ophthalmologist','optometrist')),
tr as (select id, row_number() over (order by created_at, id) rn, count(*) over () c from treatments where org_id='2538a150-279d-422d-843f-d72c89d6f242'),
g as (select i, (current_date - 360 + (i*375/1600))::date dt from generate_series(1,1600) i)
select '2538a150-279d-422d-843f-d72c89d6f242', pt.id, st.id, tr.id, g.dt,
  (time '08:30' + ((g.i%17)*interval '30 minutes'))::time,
  'Room '||(1+(g.i%4)),
  case when g.dt < current_date then (array['completed','completed','completed','completed','completed','completed','completed','no_show','cancelled'])[1+(g.i%9)]
       when g.dt = current_date then (array['checked_in','scheduled','completed'])[1+(g.i%3)]
       else 'scheduled' end,
  (g.i%11=0),
  case when g.i%5=0 then 'Patient reports blurred distance vision' when g.i%7=0 then 'Routine annual review' else null end,
  (g.dt - 3)::timestamptz
from g
join pt on pt.rn = 1 + ((g.i*7) % pt.c)
join st on st.rn = 1 + ((g.i*3) % st.c)
join tr on tr.rn = 1 + ((g.i*5) % tr.c)
where extract(dow from g.dt) <> 0;

-- EYE EXAMS
insert into eye_exams (org_id, patient_id, appointment_id, exam_date, examiner_id, chief_complaint, va_unaided_od, va_unaided_os, va_aided_od, va_aided_os, va_pinhole_od, va_pinhole_os, iop_od, iop_os, iop_method, pupils_od, pupils_os, anterior_segment_od, anterior_segment_os, fundus_od, fundus_os, cd_ratio_od, cd_ratio_os, dilated, diagnosis, plan, created_at)
select a.org_id, a.patient_id, a.id, a.appointment_date, a.staff_id,
  (array['Blurred distance vision','Headache after reading','Itchy red eyes','Routine check','Difficulty reading small print','Floaters in right eye'])[1+(x.rn%6)],
  (array['6/12','6/9','6/18','6/24','6/6'])[1+(x.rn%5)], (array['6/9','6/12','6/24','6/6','6/18'])[1+((x.rn+2)%5)],
  '6/6','6/6',(array['6/9','6/6','6/12'])[1+(x.rn%3)],(array['6/6','6/9','6/12'])[1+((x.rn+1)%3)],
  12 + (x.rn%12), 12 + ((x.rn+3)%12), 'Goldmann applanation',
  'Round, reactive','Round, reactive',
  (array['Clear cornea, quiet anterior chamber','Early nuclear sclerosis','Mild pinguecula nasally','Meibomian gland dysfunction'])[1+(x.rn%4)],
  (array['Clear cornea, quiet anterior chamber','Early cortical cataract','Clear','Mild blepharitis'])[1+((x.rn+1)%4)],
  (array['Healthy disc and macula','Mild hypertensive retinopathy','Dry macular changes','Normal vasculature'])[1+(x.rn%4)],
  (array['Healthy disc and macula','Background diabetic retinopathy','Normal','Peripapillary atrophy'])[1+((x.rn+2)%4)],
  round((0.3 + (x.rn%5)*0.1)::numeric,1), round((0.3 + ((x.rn+1)%5)*0.1)::numeric,1),
  (x.rn%3=0),
  (array['Myopic astigmatism','Presbyopia','Dry eye syndrome','Primary open angle glaucoma suspect','Immature cataract','Allergic conjunctivitis'])[1+(x.rn%6)],
  (array['Spectacle prescription issued; review in 12 months','Lubricants QID; review 4 weeks','Refer for visual fields and OCT','Book cataract assessment','Topical antihistamine; review 2 weeks','Continue current correction'])[1+(x.rn%6)],
  a.appointment_date::timestamptz
from (select a.*, row_number() over (order by a.appointment_date, a.id) rn from appointments a where a.org_id='2538a150-279d-422d-843f-d72c89d6f242' and a.status='completed') x
join appointments a on a.id=x.id
where x.rn % 10 < 7;

-- OPTICAL PRESCRIPTIONS
insert into optical_prescriptions (org_id, patient_id, eye_exam_id, prescriber_id, rx_type, issue_date, expiry_date, sphere_od, cylinder_od, axis_od, add_od, sphere_os, cylinder_os, axis_os, add_os, pd, lens_brand, notes)
select e.org_id, e.patient_id, e.id, e.examiner_id,
  (array['distance','reading','bifocal','progressive'])[1+(r.rn%4)],
  e.exam_date, (e.exam_date + 365),
  round((-4.0 + (r.rn%16)*0.5)::numeric,2), round((-1.75 + (r.rn%7)*0.25)::numeric,2), (r.rn*13)%180, case when r.rn%3=0 then 2.00 else null end,
  round((-4.0 + ((r.rn+3)%16)*0.5)::numeric,2), round((-1.75 + ((r.rn+2)%7)*0.25)::numeric,2), (r.rn*17)%180, case when r.rn%3=0 then 2.00 else null end,
  60 + (r.rn%8), (array['Essilor','Zeiss','Hoya','Nikon'])[1+(r.rn%4)],
  case when r.rn%4=0 then 'Anti-glare coating recommended' else null end
from (select id, row_number() over (order by exam_date, id) rn from eye_exams where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join eye_exams e on e.id=r.id
where r.rn % 10 < 7;

-- OPTICAL ORDERS
insert into optical_orders (org_id, patient_id, prescription_id, order_number, frame_brand, frame_model, frame_price, lens_type, lens_coatings, lens_price, lab_name, order_date, promised_date, delivered_date, total_amount, amount_paid, status, created_at)
select p.org_id, p.patient_id, p.id, 'OPT-'||to_char(p.issue_date,'YYYYMM')||'-'||lpad(r.rn::text,4,'0'),
  (array['Ray-Ban','Oakley','Police','Tom Ford','Silhouette'])[1+(r.rn%5)],
  (array['RB5154','OX8046','VPL885','TF5401','5500'])[1+(r.rn%5)],
  (array[45000,60000,38000,95000,120000])[1+(r.rn%5)],
  (array['Single Vision','Progressive','Bifocal','Photochromic'])[1+(r.rn%4)],
  (array['Anti-glare + UV','Blue-light filter','Hard coat','Anti-glare'])[1+(r.rn%4)],
  (array[35000,90000,55000,70000])[1+(r.rn%4)],
  (array['Lagos Optical Lab','Precision Lens Works'])[1+(r.rn%2)],
  p.issue_date, p.issue_date+7,
  case when p.issue_date < current_date - 10 then p.issue_date+8 else null end,
  (array[45000,60000,38000,95000,120000])[1+(r.rn%5)] + (array[35000,90000,55000,70000])[1+(r.rn%4)],
  case when r.rn%5=0 then 50000 else (array[45000,60000,38000,95000,120000])[1+(r.rn%5)] + (array[35000,90000,55000,70000])[1+(r.rn%4)] end,
  case when p.issue_date < current_date - 10 then 'delivered' when p.issue_date < current_date then 'in_lab' else 'ordered' end,
  p.issue_date::timestamptz
from (select id, row_number() over (order by issue_date, id) rn from optical_prescriptions where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join optical_prescriptions p on p.id=r.id
where r.rn % 3 < 2;

-- CONTACT LENS FITTINGS
insert into contact_lens_fittings (org_id, patient_id, fitter_id, fitting_date, lens_brand, lens_type, modality, base_curve, diameter, power_od, power_os, fit_assessment, aftercare_date, status, notes)
select e.org_id, e.patient_id, e.examiner_id, e.exam_date,
  (array['Acuvue Oasys','Biofinity','Air Optix','Dailies Total 1'])[1+(r.rn%4)],
  (array['Soft spherical','Soft toric','Multifocal'])[1+(r.rn%3)],
  (array['Daily','Monthly','Two-weekly'])[1+(r.rn%3)],
  8.6, 14.2, round((-3.5 + (r.rn%12)*0.25)::numeric,2), round((-3.25 + ((r.rn+2)%12)*0.25)::numeric,2),
  (array['Good centration and movement','Slightly tight, flatter BC trialled','Optimal fit'])[1+(r.rn%3)],
  e.exam_date+14, case when e.exam_date < current_date - 20 then 'completed' else 'in_progress' end,
  'Handling and hygiene training completed'
from (select id, row_number() over (order by exam_date, id) rn from eye_exams where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join eye_exams e on e.id=r.id
where r.rn % 9 = 0;

-- DIAGNOSTIC STUDIES
insert into eye_diagnostics (org_id, patient_id, eye_exam_id, study_type, eye, study_date, findings, performed_by, created_at)
select e.org_id, e.patient_id, e.id,
  (array['OCT Macula','Visual Field','Fundus Photography','Corneal Topography','Biometry'])[1+(r.rn%5)],
  (array['OD','OS','OU'])[1+(r.rn%3)], e.exam_date,
  (array['Normal foveal contour, central thickness 265um','Mild superior arcuate defect, MD -3.2 dB','Cup-disc 0.5, healthy neuroretinal rim','Regular astigmatism 1.25 D @ 170','Axial length 23.4 mm, IOL power 21.0 D'])[1+(r.rn%5)],
  e.examiner_id, e.exam_date::timestamptz
from (select id, row_number() over (order by exam_date, id) rn from eye_exams where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join eye_exams e on e.id=r.id
where r.rn % 4 = 0;

-- SURGERIES
insert into surgery_bookings (org_id, patient_id, surgeon_id, procedure_name, eye, scheduled_date, scheduled_time, theatre, iol_model, iol_power, biometry_notes, consent_signed, status, outcome_notes, created_at)
select e.org_id, e.patient_id, e.examiner_id,
  (array['Cataract Surgery (Phaco + IOL)','YAG Laser Capsulotomy','Pterygium Excision','Trabeculectomy'])[1+(r.rn%4)],
  (array['OD','OS'])[1+(r.rn%2)], (e.exam_date + 21), (time '08:00' + ((r.rn%6)*interval '45 minutes'))::time,
  'Theatre '||(1+(r.rn%2)), (array['Alcon SN60WF','AMO Tecnis ZCB00','Zeiss CT Lucia'])[1+(r.rn%3)],
  round((18.0 + (r.rn%9)*0.5)::numeric,1), 'Axial length within normal range; SRK/T formula used',
  true,
  case when (e.exam_date + 21) < current_date then 'completed' else 'scheduled' end,
  case when (e.exam_date + 21) < current_date then 'Uneventful procedure, day-1 VA 6/9' else null end,
  e.exam_date::timestamptz
from (select id, row_number() over (order by exam_date, id) rn from eye_exams where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join eye_exams e on e.id=r.id
where r.rn % 14 = 0;

-- CLINICAL NOTES
insert into clinical_notes (org_id, patient_id, appointment_id, subjective, objective, assessment, plan, created_by, created_at)
select e.org_id, e.patient_id, e.appointment_id,
  e.chief_complaint, 'VA OD '||e.va_unaided_od||', OS '||e.va_unaided_os||'; IOP '||e.iop_od||'/'||e.iop_os||' mmHg',
  e.diagnosis, e.plan, null, e.exam_date::timestamptz
from eye_exams e where e.org_id='2538a150-279d-422d-843f-d72c89d6f242';

-- PRESCRIPTIONS (medications)
insert into prescriptions (org_id, patient_id, dentist_id, prescription_date, diagnosis, notes, status, created_at)
select e.org_id, e.patient_id, e.examiner_id, e.exam_date, e.diagnosis, 'Use as directed; return if symptoms worsen', 'issued', e.exam_date::timestamptz
from (select id, row_number() over (order by exam_date, id) rn from eye_exams where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join eye_exams e on e.id=r.id where r.rn % 3 = 0;

insert into prescription_medications (prescription_id, medication_name, dosage, frequency, duration, instructions)
select p.id,
  (array['Systane Ultra eye drops','Timolol 0.5% eye drops','Latanoprost 0.005%','Olopatadine 0.1%','Moxifloxacin 0.5%','Prednisolone acetate 1%'])[1+(r.rn%6)],
  (array['1 drop','1 drop','1 drop','1 drop','1 drop','1 drop'])[1+(r.rn%6)],
  (array['4 times daily','twice daily','at night','twice daily','4 times daily','6 times daily tapering'])[1+(r.rn%6)],
  (array['4 weeks','ongoing','ongoing','2 weeks','1 week','4 weeks'])[1+(r.rn%6)],
  'Shake well; wait 5 minutes between different drops'
from (select id, row_number() over (order by created_at, id) rn from prescriptions where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join prescriptions p on p.id=r.id;

-- INVOICES
insert into invoices (org_id, invoice_number, patient_id, invoice_date, due_date, status, subtotal, discount, tax, total, payment_method, created_at)
select a.org_id, 'INV-'||to_char(a.appointment_date,'YYYYMM')||'-'||lpad(x.rn::text,5,'0'), a.patient_id,
  a.appointment_date, a.appointment_date + 14,
  case when x.rn%10 < 8 then 'paid' when x.rn%10 = 8 then 'partial' else 'unpaid' end,
  t.price, case when x.rn%13=0 then round(t.price*0.1) else 0 end, 0,
  t.price - case when x.rn%13=0 then round(t.price*0.1) else 0 end,
  (array['cash','transfer','card','hmo'])[1+(x.rn%4)], a.appointment_date::timestamptz
from (select a.id, row_number() over (order by a.appointment_date, a.id) rn from appointments a where a.org_id='2538a150-279d-422d-843f-d72c89d6f242' and a.status='completed') x
join appointments a on a.id=x.id
join treatments t on t.id=a.treatment_id;

insert into invoice_items (invoice_id, treatment_id, description, quantity, unit_price, line_total)
select distinct on (i.id) i.id, a.treatment_id, t.name, 1, t.price, t.price
from invoices i
join appointments a on a.org_id=i.org_id and a.patient_id=i.patient_id and a.appointment_date=i.invoice_date and a.status='completed'
join treatments t on t.id=a.treatment_id
where i.org_id='2538a150-279d-422d-843f-d72c89d6f242';

insert into payments (org_id, invoice_id, amount, payment_method, payment_date, reference, created_at)
select i.org_id, i.id, case when i.status='paid' then i.total else round(i.total*0.5) end,
  i.payment_method, i.invoice_date, 'PAY-'||substr(replace(i.id::text,'-',''),1,10), i.invoice_date::timestamptz
from invoices i where i.org_id='2538a150-279d-422d-843f-d72c89d6f242' and i.status in ('paid','partial');

-- EXPENSES (12 months)
insert into expenses (org_id, expense_date, category, amount, description, vendor, payment_method, created_at)
select '2538a150-279d-422d-843f-d72c89d6f242',
  (date_trunc('month', current_date) - ((m)||' months')::interval + ((k*4)||' days')::interval)::date,
  (array['Staff Salaries','Rent','Utilities','Optical Stock','Drugs & Consumables','Equipment Maintenance','Marketing','Transport'])[k],
  (array[2850000,650000,220000,1450000,380000,180000,250000,120000])[k] + (m*1000),
  (array['Monthly payroll','Clinic rent','Electricity, diesel and water','Frames and lenses restock','Eye drops and theatre consumables','Slit lamp and OCT servicing','Radio and social media ads','Fuel and logistics'])[k],
  (array['Internal','Landmark Properties','Ikeja Electric','Lagos Optical Lab','MedSupply Nigeria','OptiTech Services','BrandReach','Internal'])[k],
  'transfer',
  (date_trunc('month', current_date) - ((m)||' months')::interval)::timestamptz
from generate_series(0,11) m, generate_series(1,8) k;

-- INVENTORY
insert into inventory (org_id, name, category, unit, quantity, min_stock, supplier, last_restocked, unit_cost, expiry_date) values
('2538a150-279d-422d-843f-d72c89d6f242','Ray-Ban RB5154 Frame','Frames','piece',18,5,'Luxottica NG',current_date-20,32000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Oakley OX8046 Frame','Frames','piece',9,5,'Luxottica NG',current_date-35,44000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Police VPL885 Frame','Frames','piece',3,6,'EyeWear Imports',current_date-60,26000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Budget Metal Frame','Frames','piece',52,10,'EyeWear Imports',current_date-12,9000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Single Vision Lens 1.56','Lenses','pair',140,30,'Lagos Optical Lab',current_date-8,6500,null),
('2538a150-279d-422d-843f-d72c89d6f242','Progressive Lens 1.6','Lenses','pair',26,15,'Lagos Optical Lab',current_date-8,42000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Photochromic Lens 1.59','Lenses','pair',11,12,'Precision Lens Works',current_date-30,31000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Acuvue Oasys (6pk)','Contact Lenses','box',34,10,'J&J Vision',current_date-15,14000,current_date+400),
('2538a150-279d-422d-843f-d72c89d6f242','Dailies Total 1 (30pk)','Contact Lenses','box',7,10,'Alcon',current_date-45,22000,current_date+300),
('2538a150-279d-422d-843f-d72c89d6f242','Contact Lens Solution 360ml','Contact Lenses','bottle',48,15,'Alcon',current_date-10,4500,current_date+540),
('2538a150-279d-422d-843f-d72c89d6f242','Systane Ultra Drops','Pharmacy','bottle',63,20,'MedSupply Nigeria',current_date-6,3800,current_date+200),
('2538a150-279d-422d-843f-d72c89d6f242','Timolol 0.5% Drops','Pharmacy','bottle',22,10,'MedSupply Nigeria',current_date-18,2500,current_date+150),
('2538a150-279d-422d-843f-d72c89d6f242','Latanoprost 0.005%','Pharmacy','bottle',14,8,'MedSupply Nigeria',current_date-18,7800,current_date+120),
('2538a150-279d-422d-843f-d72c89d6f242','Moxifloxacin 0.5%','Pharmacy','bottle',9,10,'PharmaPlus',current_date-40,5200,current_date+90),
('2538a150-279d-422d-843f-d72c89d6f242','Tropicamide 1%','Pharmacy','bottle',30,10,'PharmaPlus',current_date-22,1800,current_date+240),
('2538a150-279d-422d-843f-d72c89d6f242','Fluorescein Strips','Consumables','pack',25,8,'MedSupply Nigeria',current_date-14,3200,current_date+365),
('2538a150-279d-422d-843f-d72c89d6f242','Tonometer Prisms','Consumables','piece',6,4,'OptiTech Services',current_date-90,18000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Alcon SN60WF IOL','Theatre','piece',15,6,'Alcon',current_date-25,52000,current_date+700),
('2538a150-279d-422d-843f-d72c89d6f242','Viscoelastic Syringe','Theatre','piece',12,8,'MedSupply Nigeria',current_date-25,16000,current_date+280),
('2538a150-279d-422d-843f-d72c89d6f242','Phaco Tip Pack','Theatre','pack',4,5,'Alcon',current_date-55,38000,null),
('2538a150-279d-422d-843f-d72c89d6f242','Surgical Gloves (100)','Theatre','box',20,6,'MedSupply Nigeria',current_date-9,12000,current_date+500),
('2538a150-279d-422d-843f-d72c89d6f242','Spectacle Cases','Optical Accessories','piece',90,25,'EyeWear Imports',current_date-16,1200,null),
('2538a150-279d-422d-843f-d72c89d6f242','Lens Cleaning Spray','Optical Accessories','bottle',41,15,'EyeWear Imports',current_date-16,1500,current_date+600),
('2538a150-279d-422d-843f-d72c89d6f242','Microfibre Cloths','Optical Accessories','piece',120,30,'EyeWear Imports',current_date-16,400,null),
('2538a150-279d-422d-843f-d72c89d6f242','Printer Paper A4','Office','ream',15,5,'OfficeMart',current_date-11,4500,null);

-- RECALLS
insert into patient_recalls (org_id, patient_id, recall_type, due_date, status, last_contacted_at, notes)
select e.org_id, e.patient_id,
  (array['Annual eye examination','Glaucoma review','Contact lens aftercare','Post-op review','Diabetic retinopathy screening'])[1+(r.rn%5)],
  (e.exam_date + (array[365,180,30,14,365])[1+(r.rn%5)])::date,
  case when (e.exam_date + 180) < current_date then (array['contacted','overdue','booked'])[1+(r.rn%3)] else 'pending' end,
  case when r.rn%3=0 then (e.exam_date + 170)::timestamptz else null end,
  null
from (select id, row_number() over (order by exam_date, id) rn from eye_exams where org_id='2538a150-279d-422d-843f-d72c89d6f242') r
join eye_exams e on e.id=r.id
where r.rn % 2 = 0;

-- REVIEWS
insert into patient_reviews (org_id, patient_id, staff_id, rating, comment, created_at)
select a.org_id, a.patient_id, a.staff_id,
  (array[5,5,5,4,4,3,5,4])[1+(x.rn%8)],
  (array['Very thorough examination, explained everything clearly.','Short waiting time and friendly staff.','Got my glasses in three days, perfect fit.','Doctor was patient with my mother.','Clean clinic and modern equipment.','Waiting area was a bit crowded but care was good.','Best eye clinic I have visited in Lagos.','Helpful optician helped me choose frames.'])[1+(x.rn%8)],
  a.appointment_date::timestamptz
from (select a.id, row_number() over (order by a.appointment_date, a.id) rn from appointments a where a.org_id='2538a150-279d-422d-843f-d72c89d6f242' and a.status='completed') x
join appointments a on a.id=x.id
where x.rn % 8 = 0;

-- TODAY'S WAITING LIST
insert into waiting_list (org_id, patient_id, appointment_id, status, check_in_time, called_time, seen_time, chair, priority, notes)
select a.org_id, a.patient_id, a.id,
  (array['waiting','in_progress','waiting','completed','waiting'])[1+(x.rn%5)],
  now() - ((x.rn*7)||' minutes')::interval,
  case when x.rn%5 in (1,3) then now() - ((x.rn*5)||' minutes')::interval else null end,
  case when x.rn%5 = 1 then now() - ((x.rn*4)||' minutes')::interval else null end,
  a.chair, 1+(x.rn%3),
  case when x.rn%4=0 then 'Elderly patient, assist to consulting room' else null end
from (select a.id, row_number() over (order by a.appointment_time) rn from appointments a where a.org_id='2538a150-279d-422d-843f-d72c89d6f242' and a.appointment_date=current_date) x
join appointments a on a.id=x.id;
