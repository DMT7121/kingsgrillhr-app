-- HR WebApp Supabase seed.sql
-- Tạo dữ liệu mẫu cho 150 nhân sự, phòng ban, ca làm, nghỉ phép, lương, KPI, tuyển dụng.
-- Chạy sau schema.sql. Có thể chạy nhiều lần ở môi trường dev nếu muốn reset trước khi seed.

-- =========================================================
-- CLEAN DEV DATA, theo thứ tự phụ thuộc.
-- KHÔNG chạy trên production nếu đã có dữ liệu thật.
-- =========================================================
truncate table
  public.interviews,
  public.candidate_pipeline,
  public.candidates,
  public.recruitment_jobs,
  public.training_enrollments,
  public.training_courses,
  public.performance_reviews,
  public.okr_key_results,
  public.okr_objectives,
  public.kpis,
  public.employee_benefits,
  public.benefits,
  public.payroll_items,
  public.payroll_periods,
  public.approval_steps,
  public.approval_requests,
  public.leave_requests,
  public.leave_types,
  public.shift_change_requests,
  public.overtime_requests,
  public.attendance_adjustments,
  public.attendance_records,
  public.shift_assignments,
  public.work_shifts,
  public.notifications,
  public.chat_messages,
  public.chat_rooms,
  public.documents,
  public.activity_logs,
  public.app_settings,
  public.profiles,
  public.employees,
  public.positions,
  public.departments,
  public.branches
restart identity cascade;

-- =========================================================
-- MASTER DATA
-- =========================================================
insert into public.branches (code, name, address, lat, lng, radius_meters) values
('HN-HQ', 'Trụ sở Hà Nội', 'Quận Cầu Giấy, Hà Nội', 21.0362370, 105.7905830, 180),
('HCM-Q1', 'Chi nhánh TP.HCM Q1', 'Quận 1, TP.HCM', 10.7765300, 106.7009810, 180),
('DN-HQ', 'Chi nhánh Đà Nẵng', 'Hải Châu, Đà Nẵng', 16.0470790, 108.2062300, 180);

insert into public.departments (code, name) values
('BOD', 'Ban Giám đốc'),
('HR', 'Phòng Nhân sự'),
('FIN', 'Phòng Tài chính'),
('OPS', 'Vận hành'),
('SALES', 'Kinh doanh'),
('MKT', 'Marketing'),
('TECH', 'Công nghệ'),
('CS', 'Chăm sóc khách hàng'),
('REC', 'Tuyển dụng');

insert into public.positions (code, name, level) values
('CEO', 'Tổng Giám đốc', 5),
('HRM', 'Trưởng phòng Nhân sự', 4),
('FINM', 'Trưởng phòng Tài chính', 4),
('OPSM', 'Quản lý Vận hành', 4),
('SALESM', 'Trưởng nhóm Kinh doanh', 3),
('MKTSP', 'Chuyên viên Marketing', 2),
('DEV', 'Lập trình viên', 2),
('CSR', 'Nhân viên CSKH', 1),
('STAFF', 'Nhân viên', 1),
('INTERN', 'Thực tập sinh', 0);

insert into public.work_shifts (code, name, start_time, end_time, break_minutes) values
('HC', 'Ca hành chính', '08:00', '17:00', 60),
('S1', 'Ca sáng', '06:00', '14:00', 45),
('S2', 'Ca chiều', '14:00', '22:00', 45),
('REMOTE', 'Làm việc từ xa', '09:00', '18:00', 60);

insert into public.leave_types (code, name, annual_quota, is_paid) values
('ANNUAL', 'Nghỉ phép năm', 12, true),
('SICK', 'Nghỉ ốm', 6, true),
('UNPAID', 'Nghỉ không lương', 0, false),
('BUSINESS', 'Công tác', 0, true);

insert into public.benefits (code, name, description, amount) values
('LUNCH', 'Phụ cấp ăn trưa', 'Phụ cấp theo tháng', 730000),
('PARKING', 'Gửi xe', 'Hỗ trợ gửi xe hằng tháng', 200000),
('HEALTH', 'Bảo hiểm sức khỏe', 'Gói sức khỏe mở rộng', 500000),
('PHONE', 'Điện thoại', 'Hỗ trợ liên lạc công việc', 300000);

insert into public.payroll_periods (code, name, from_date, to_date, status) values
('2026-04', 'Kỳ lương tháng 04/2026', '2026-04-01', '2026-04-30', 'approved'),
('2026-05', 'Kỳ lương tháng 05/2026', '2026-05-01', '2026-05-31', 'calculated');

-- =========================================================
-- 150 EMPLOYEES
-- =========================================================
with seq as (
  select generate_series(1, 150) as n
), mapped as (
  select
    n,
    case
      when n = 1 then 'BOD'
      when n between 2 and 10 then 'HR'
      when n between 11 and 25 then 'FIN'
      when n between 26 and 60 then 'OPS'
      when n between 61 and 90 then 'SALES'
      when n between 91 and 110 then 'MKT'
      when n between 111 and 135 then 'TECH'
      when n between 136 and 145 then 'CS'
      else 'REC'
    end as dept_code,
    case
      when n = 1 then 'CEO'
      when n in (2,11,26,61) then 'HRM'
      when n in (91,111,136) then 'OPSM'
      when n % 17 = 0 then 'SALESM'
      when n % 13 = 0 then 'DEV'
      when n % 11 = 0 then 'MKTSP'
      when n % 7 = 0 then 'CSR'
      else 'STAFF'
    end as pos_code,
    case when n % 3 = 0 then 'DN-HQ' when n % 2 = 0 then 'HCM-Q1' else 'HN-HQ' end as branch_code
  from seq
)
insert into public.employees (
  employee_code, full_name, email, phone, gender, date_of_birth,
  branch_id, department_id, position_id, hire_date, status, avatar_url, base_salary
)
select
  'NV' || lpad(n::text, 3, '0') as employee_code,
  'Nhân viên ' || lpad(n::text, 3, '0') as full_name,
  'nv' || lpad(n::text, 3, '0') || '@demo-hr.local' as email,
  '09' || lpad((10000000 + n)::text, 8, '0') as phone,
  case when n % 2 = 0 then 'Nam' else 'Nữ' end as gender,
  date '1988-01-01' + (n * 47 % 6000) as date_of_birth,
  b.id,
  d.id,
  p.id,
  date '2020-01-01' + (n * 11 % 1800) as hire_date,
  case when n <= 140 then 'active'::public.employee_status when n <= 146 then 'probation'::public.employee_status else 'on_leave'::public.employee_status end as status,
  'https://api.dicebear.com/7.x/initials/svg?seed=NV' || lpad(n::text, 3, '0') as avatar_url,
  case
    when p.level >= 5 then 60000000
    when p.level = 4 then 35000000 + (n % 5) * 1000000
    when p.level = 3 then 25000000 + (n % 5) * 800000
    when p.level = 2 then 16000000 + (n % 8) * 500000
    else 9000000 + (n % 9) * 400000
  end as base_salary
from mapped m
join public.branches b on b.code = m.branch_code
join public.departments d on d.code = m.dept_code
join public.positions p on p.code = m.pos_code;

-- Gán manager: CEO quản lý trưởng nhóm; trưởng nhóm quản lý nhân viên cùng phòng.
update public.employees e
set manager_id = (select id from public.employees where employee_code = 'NV001')
where employee_code in ('NV002','NV011','NV026','NV061','NV091','NV111','NV136');

update public.employees e
set manager_id = coalesce((
  select m.id from public.employees m
  where m.department_id = e.department_id
    and m.employee_code in ('NV002','NV011','NV026','NV061','NV091','NV111','NV136')
  limit 1
), (select id from public.employees where employee_code = 'NV001'))
where e.employee_code not in ('NV001','NV002','NV011','NV026','NV061','NV091','NV111','NV136');

-- NOTE: profiles cần auth.users thực tế. Seed mẫu chỉ tạo employee data.
-- Sau khi tạo users trong Supabase Auth, map auth.users -> profiles bằng employee email.

-- =========================================================
-- SHIFT ASSIGNMENTS + ATTENDANCE SAMPLE
-- =========================================================
insert into public.shift_assignments (employee_id, shift_id, work_date, status)
select e.id, s.id, d::date, 'approved'
from public.employees e
cross join generate_series(date '2026-05-01', date '2026-05-14', interval '1 day') d
join public.work_shifts s on s.code = case when extract(dow from d) in (0) then 'REMOTE' when mod(abs(hashtext(e.employee_code || d::text)), 3) = 0 then 'S1' when mod(abs(hashtext(e.employee_code || d::text)), 3) = 1 then 'S2' else 'HC' end
where extract(dow from d) <> 0;

insert into public.attendance_records (employee_id, shift_assignment_id, work_date, check_in_at, check_out_at, check_in_lat, check_in_lng, check_out_lat, check_out_lng, status, note)
select
  sa.employee_id,
  sa.id,
  sa.work_date,
  (sa.work_date::timestamptz + s.start_time + make_interval(mins => mod(abs(hashtext(sa.id::text)), 25))) as check_in_at,
  (sa.work_date::timestamptz + s.end_time - make_interval(mins => mod(abs(hashtext(sa.employee_id::text)), 20))) as check_out_at,
  10.7765300, 106.7009810, 10.7765300, 106.7009810,
  case when mod(abs(hashtext(sa.id::text)), 10) = 0 then 'late'::public.attendance_status else 'valid'::public.attendance_status end,
  'Seed dữ liệu chấm công mẫu'
from public.shift_assignments sa
join public.work_shifts s on s.id = sa.shift_id
where sa.work_date <= date '2026-05-10';

-- =========================================================
-- LEAVE REQUESTS + APPROVALS
-- =========================================================
insert into public.leave_requests (employee_id, leave_type_id, from_date, to_date, total_days, reason, status, approved_by, approved_at)
select
  e.id,
  lt.id,
  date '2026-05-15' + (mod(n, 10))::int,
  date '2026-05-15' + (mod(n, 10))::int,
  1,
  case when mod(n,3)=0 then 'Việc cá nhân' when mod(n,3)=1 then 'Nghỉ phép năm' else 'Nghỉ ốm' end,
  case when mod(n,4)=0 then 'pending'::public.request_status when mod(n,4)=1 then 'approved'::public.request_status when mod(n,4)=2 then 'rejected'::public.request_status else 'pending'::public.request_status end,
  e.manager_id,
  case when mod(n,4) in (1,2) then now() - interval '1 day' else null end
from (
  select e.*, row_number() over (order by employee_code) as n from public.employees e
) e
join public.leave_types lt on lt.code = case when mod(n, 3)=0 then 'ANNUAL' when mod(n,3)=1 then 'SICK' else 'UNPAID' end
where n between 1 and 60;

insert into public.approval_requests (request_type, ref_table, ref_id, requester_id, current_approver_id, status)
select 'leave_request', 'leave_requests', lr.id, lr.employee_id, lr.approved_by, lr.status
from public.leave_requests lr;

insert into public.approval_steps (approval_request_id, step_order, approver_id, status, action_note, acted_at)
select ar.id, 1, ar.current_approver_id, ar.status, 'Seed bước phê duyệt cấp quản lý', case when ar.status in ('approved','rejected') then now() - interval '1 day' else null end
from public.approval_requests ar;

-- =========================================================
-- PAYROLL + BENEFITS
-- =========================================================
insert into public.payroll_items (payroll_period_id, employee_id, base_salary, allowance, overtime_pay, bonus, deduction, insurance, tax, status)
select
  pp.id,
  e.id,
  e.base_salary,
  730000,
  mod(abs(hashtext(e.employee_code)), 10) * 120000,
  case when mod(abs(hashtext(e.employee_code)), 7)=0 then 1500000 else 0 end,
  mod(abs(hashtext(e.email)), 5) * 100000,
  e.base_salary * 0.08,
  greatest(e.base_salary - 11000000, 0) * 0.05,
  case when pp.code = '2026-04' then 'paid'::public.payroll_status else 'calculated'::public.payroll_status end
from public.employees e
cross join public.payroll_periods pp;

insert into public.employee_benefits (employee_id, benefit_id, start_date, status)
select e.id, b.id, date '2026-01-01', 'approved'
from public.employees e
join public.benefits b on b.code in ('LUNCH','PARKING')
where e.status in ('active','probation');

insert into public.employee_benefits (employee_id, benefit_id, start_date, status)
select e.id, b.id, date '2026-01-01', 'approved'
from public.employees e
join public.benefits b on b.code in ('HEALTH','PHONE')
where mod(abs(hashtext(e.employee_code)), 3) = 0;

-- =========================================================
-- KPI / OKR / TRAINING
-- =========================================================
insert into public.kpis (employee_id, period_code, name, target_value, actual_value, unit, score)
select e.id, '2026-Q2', 'Hoàn thành công việc đúng hạn', 100, 70 + mod(abs(hashtext(e.employee_code)), 31), '%', 70 + mod(abs(hashtext(e.employee_code)), 31)
from public.employees e;

insert into public.okr_objectives (employee_id, department_id, title, description, period_code, progress, status)
select e.id, e.department_id, 'Nâng cao hiệu suất cá nhân Q2', 'OKR mẫu cho dashboard hiệu suất', '2026-Q2', 50 + mod(abs(hashtext(e.email)), 46), 'approved'
from public.employees e
where mod(abs(hashtext(e.employee_code)), 4) = 0;

insert into public.okr_key_results (objective_id, title, target_value, current_value, unit)
select o.id, 'Hoàn thành 95% task đúng hạn', 95, least(95, 50 + mod(abs(hashtext(o.id::text)), 46)), '%'
from public.okr_objectives o;

insert into public.performance_reviews (employee_id, reviewer_id, period_code, score, feedback, status)
select e.id, e.manager_id, '2026-Q2', 70 + mod(abs(hashtext(e.employee_code)), 31), 'Đánh giá mẫu: thái độ tốt, cần tiếp tục cải thiện hiệu suất.', 'pending'
from public.employees e
where e.manager_id is not null;

insert into public.training_courses (code, title, description, start_date, end_date) values
('ONB-001', 'Hội nhập nhân viên mới', 'Quy trình onboarding và văn hóa công ty', '2026-05-01', '2026-05-31'),
('SEC-001', 'Bảo mật dữ liệu nhân sự', 'Nguyên tắc bảo mật thông tin nội bộ', '2026-05-10', '2026-05-20'),
('MGR-001', 'Kỹ năng quản lý đội nhóm', 'Dành cho Manager/HR', '2026-05-15', '2026-06-15');

insert into public.training_enrollments (course_id, employee_id, progress, status)
select c.id, e.id, mod(abs(hashtext(c.code || e.employee_code)), 101), case when mod(abs(hashtext(c.code || e.employee_code)), 101) >= 90 then 'approved'::public.request_status else 'pending'::public.request_status end
from public.training_courses c
cross join public.employees e
where (c.code = 'ONB-001' and e.status = 'probation')
   or (c.code = 'SEC-001' and mod(abs(hashtext(e.employee_code)), 5)=0)
   or (c.code = 'MGR-001' and e.employee_code in ('NV002','NV011','NV026','NV061','NV091','NV111','NV136'));

-- =========================================================
-- RECRUITMENT
-- =========================================================
insert into public.recruitment_jobs (code, title, department_id, position_id, openings, status)
select 'JOB-DEV-01', 'Frontend Developer', d.id, p.id, 3, 'approved' from public.departments d join public.positions p on p.code='DEV' where d.code='TECH'
union all
select 'JOB-HR-01', 'Chuyên viên Nhân sự', d.id, p.id, 2, 'approved' from public.departments d join public.positions p on p.code='STAFF' where d.code='HR'
union all
select 'JOB-SALES-01', 'Nhân viên Kinh doanh', d.id, p.id, 5, 'approved' from public.departments d join public.positions p on p.code='STAFF' where d.code='SALES';

with seq as (select generate_series(1, 45) as n), jobs as (
  select id, row_number() over(order by code) rn from public.recruitment_jobs
)
insert into public.candidates (job_id, full_name, email, phone, source, resume_url, status)
select
  j.id,
  'Ứng viên ' || lpad(n::text, 3, '0'),
  'candidate' || lpad(n::text, 3, '0') || '@demo-hr.local',
  '08' || lpad((20000000 + n)::text, 8, '0'),
  case when mod(n,3)=0 then 'LinkedIn' when mod(n,3)=1 then 'Website' else 'Referral' end,
  'storage://candidate-resumes/candidate-' || lpad(n::text, 3, '0') || '.pdf',
  case when mod(n,6)=0 then 'hired'::public.candidate_status when mod(n,5)=0 then 'offer'::public.candidate_status when mod(n,4)=0 then 'interview'::public.candidate_status when mod(n,3)=0 then 'screening'::public.candidate_status else 'new'::public.candidate_status end
from seq
join jobs j on j.rn = ((n - 1) % 3) + 1;

insert into public.candidate_pipeline (candidate_id, stage, note, scheduled_at, owner_id)
select c.id, c.status, 'Pipeline seed: ' || c.status::text, now() + (row_number() over(order by c.created_at) || ' days')::interval, (select id from public.employees where employee_code='NV002')
from public.candidates c;

insert into public.interviews (candidate_id, interviewer_id, scheduled_at, result, note)
select c.id, (select id from public.employees where employee_code='NV111'), now() + (row_number() over(order by c.created_at) || ' days')::interval, null, 'Lịch phỏng vấn mẫu'
from public.candidates c
where c.status in ('interview','offer','hired');

-- =========================================================
-- COMMUNICATION, DOCS, SETTINGS
-- =========================================================
insert into public.chat_rooms (name, room_type, created_by) values
('Thông báo toàn công ty', 'company', (select id from public.employees where employee_code='NV002')),
('HR Support', 'group', (select id from public.employees where employee_code='NV002')),
('Vận hành hằng ngày', 'group', (select id from public.employees where employee_code='NV026'));

insert into public.chat_messages (room_id, sender_id, message)
select r.id, e.id, 'Tin nhắn mẫu cho ' || r.name
from public.chat_rooms r
cross join lateral (select id from public.employees order by employee_code limit 5) e;

insert into public.notifications (employee_id, type, title, body, is_read)
select e.id, 'system', 'Chào mừng đến HR WebApp', 'Đây là thông báo mẫu cho dashboard.', false
from public.employees e
where e.employee_code <= 'NV020';

insert into public.documents (employee_id, title, document_type, file_url, file_size_bytes, is_confidential)
select e.id, 'Hợp đồng lao động ' || e.employee_code, 'contract', 'storage://documents/contracts/' || e.employee_code || '.pdf', 245760, true
from public.employees e
where e.employee_code <= 'NV030';

insert into public.app_settings (key, value, description) values
('attendance', '{"gps_required": true, "selfie_required": true, "default_radius_meters": 180}', 'Cấu hình chấm công'),
('ui', '{"theme": "premium-blue", "language": "vi"}', 'Cấu hình giao diện'),
('limits', '{"max_employees_free_plan": 150, "max_upload_mb": 5}', 'Giới hạn vận hành miễn phí dài hạn');

insert into public.activity_logs (actor_id, action, target_table, metadata)
select (select id from public.employees where employee_code='NV002'), 'seed_database', 'all', '{"source":"seed.sql", "note":"Demo data for HR WebApp"}'::jsonb;

-- Tổng kiểm tra nhanh
select
  (select count(*) from public.employees) as employees,
  (select count(*) from public.shift_assignments) as shift_assignments,
  (select count(*) from public.attendance_records) as attendance_records,
  (select count(*) from public.leave_requests) as leave_requests,
  (select count(*) from public.payroll_items) as payroll_items,
  (select count(*) from public.kpis) as kpis,
  (select count(*) from public.candidates) as candidates;
