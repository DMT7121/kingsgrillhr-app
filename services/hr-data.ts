/**
 * HR Data Service — dual-mode: Supabase (real) or mock data.
 * Import { hrData } from "@/services/hr-data" to use.
 * Each function checks isSupabaseConfigured and returns real or mock data accordingly.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { employees as mockEmployees, departments as mockDepartments } from "@/lib/mock-data";

/* ────────── Types ────────── */
export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  branch: string | null;
  status: string;
  avatar_url: string | null;
  hire_date: string | null;
  base_salary: number;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  score: number;
}

export interface AttendanceRecord {
  id: string;
  time: string;
  action: string;
  status: string;
}

export interface Shift {
  id: string;
  name: string;
  time: string;
  employees: number;
  status: string;
}

export interface LeaveRequest {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
  reason: string;
}

export interface PayrollDetail {
  periodName: string;
  items: { label: string; amount: number; deduct?: boolean }[];
  netSalary: number;
}

export interface PayrollHistoryItem {
  period: string;
  net: number;
  status: string;
}

export interface PayrollData {
  latest: PayrollDetail | null;
  history: PayrollHistoryItem[];
}

export interface KpiItem {
  id: string;
  name: string;
  target: string;
  actual: string;
  score: number;
  status: string;
}

export interface OkrKeyResult {
  title: string;
  progress: number;
}

export interface OkrObjective {
  id: string;
  title: string;
  quarter: string;
  progress: number;
  krs: OkrKeyResult[];
}

export interface PerformanceReview {
  id: string;
  period: string;
  reviewer: string;
  score: number;
  feedback: string;
  status: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  employee: string;
  code: string;
  type: string;
  date: string;
  status: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  progress: number;
  status: string;
  deadline: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeToday: number;
  onLeave: number;
  lateToday: number;
}

export interface AppDocument {
  id: string;
  title: string;
  type: string;
  url: string;
  size: number;
  date: string;
  status: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actor: string;
  module: string;
  time: string;
}

export interface EmployeeBenefit {
  id: string;
  name: string;
  description: string;
  amount: number;
  status: string;
}

/* ────────── Employees ────────── */
async function getEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured) {
    return mockEmployees.map((e) => ({
      id: e.id,
      employee_code: e.code,
      full_name: e.name,
      email: e.email,
      phone: e.phone,
      department: e.department,
      position: e.position,
      branch: null,
      status: e.status === "Đang làm" ? "active" : e.status === "Nghỉ phép" ? "on_leave" : "active",
      avatar_url: null,
      hire_date: e.joinDate,
      base_salary: 0,
    }));
  }

  const { data, error } = await supabase
    .from("employees")
    .select(`
      id, employee_code, full_name, email, phone, status, avatar_url, hire_date, base_salary,
      departments:department_id(name),
      positions:position_id(name),
      branches:branch_id(name)
    `)
    .eq("is_deleted", false)
    .order("employee_code");

  if (error || !data) return [];

  return data.map((e: any) => ({
    id: e.id,
    employee_code: e.employee_code,
    full_name: e.full_name,
    email: e.email,
    phone: e.phone,
    department: e.departments?.name ?? null,
    position: e.positions?.name ?? null,
    branch: e.branches?.name ?? null,
    status: e.status,
    avatar_url: e.avatar_url,
    hire_date: e.hire_date,
    base_salary: Number(e.base_salary ?? 0),
  }));
}

async function getEmployeeById(id: string): Promise<Employee | null> {
  if (!isSupabaseConfigured) {
    const emp = mockEmployees.find((e) => e.id === id);
    if (!emp) return null;
    return {
      id: emp.id, employee_code: emp.code, full_name: emp.name,
      email: emp.email, phone: emp.phone, department: emp.department,
      position: emp.position, branch: null, status: "active",
      avatar_url: null, hire_date: emp.joinDate, base_salary: 0,
    };
  }

  const { data, error } = await supabase
    .from("employees")
    .select(`
      id, employee_code, full_name, email, phone, status, avatar_url, hire_date, base_salary,
      departments:department_id(name),
      positions:position_id(name),
      branches:branch_id(name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id, employee_code: data.employee_code, full_name: data.full_name,
    email: data.email, phone: data.phone,
    department: (data as any).departments?.name ?? null,
    position: (data as any).positions?.name ?? null,
    branch: (data as any).branches?.name ?? null,
    status: data.status, avatar_url: data.avatar_url,
    hire_date: data.hire_date, base_salary: Number(data.base_salary ?? 0),
  };
}

/* ────────── Dashboard Stats ────────── */
async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured) {
    return {
      totalEmployees: mockEmployees.length,
      activeToday: 86,
      onLeave: 14,
      lateToday: 7,
    };
  }

  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false);

  const { count: onLeave } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("status", "on_leave")
    .eq("is_deleted", false);

  // Today's attendance
  const today = new Date().toISOString().slice(0, 10);
  const { count: activeToday } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("work_date", today);

  const { count: lateToday } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("work_date", today)
    .eq("status", "late");

  return {
    totalEmployees: totalEmployees ?? 0,
    activeToday: activeToday ?? 0,
    onLeave: onLeave ?? 0,
    lateToday: lateToday ?? 0,
  };
}

/* ────────── Departments ────────── */
async function getDepartments() {
  if (!isSupabaseConfigured) return mockDepartments;

  const { data } = await supabase
    .from("departments")
    .select("id, code, name")
    .eq("is_deleted", false)
    .order("name");

  return data ?? [];
}

/* ────────── Candidates ────────── */
async function getCandidates(): Promise<Candidate[]> {
  if (!isSupabaseConfigured) {
    return Array.from({ length: 18 }).map((_, index) => ({
      id: `cand-${index + 1}`,
      name: ["Lan Anh", "Minh Khang", "Hà Phương", "Tuấn Kiệt", "Bảo Ngọc", "Hoài Nam"][index % 6],
      role: ["Nhân viên phục vụ", "HR Executive", "Kế toán tổng hợp", "Bếp chính"][index % 4],
      stage: ["CV mới", "Sơ loại", "Phỏng vấn", "Offer"][index % 4],
      score: 70 + (index % 25)
    }));
  }

  const { data, error } = await supabase
    .from("candidates")
    .select(`
      id, full_name, status,
      recruitment_jobs:job_id(title)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c: any) => {
    let stageStr = "CV mới";
    if (c.status === "screening") stageStr = "Sơ loại";
    if (c.status === "interview") stageStr = "Phỏng vấn";
    if (c.status === "offer") stageStr = "Offer";
    if (c.status === "hired") stageStr = "Đã tuyển";
    if (c.status === "rejected") stageStr = "Từ chối";

    return {
      id: c.id,
      name: c.full_name,
      role: c.recruitment_jobs?.title || "Không rõ",
      stage: stageStr,
      score: 85 // Supabase seed doesn't have score by default, mock it or use a default
    };
  });
}

/* ────────── Attendance ────────── */
async function getAttendanceHistory(employeeId?: string): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", time: "08:01", action: "Vào ca", status: "Thành công" },
      { id: "2", time: "12:00", action: "Ra nghỉ", status: "Thành công" },
      { id: "3", time: "13:03", action: "Vào lại", status: "Thành công" },
    ];
  }

  // If we don't have an employeeId passed, try to get the current user's profile
  let targetEmployeeId = employeeId;
  if (!targetEmployeeId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
    if (!profile?.employee_id) return [];
    targetEmployeeId = profile.employee_id;
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, check_in, check_out, status")
    .eq("employee_id", targetEmployeeId)
    .eq("work_date", today);

  if (error || !data) return [];

  const history: AttendanceRecord[] = [];
  data.forEach((r: any) => {
    if (r.check_in) {
      history.push({
        id: `${r.id}-in`,
        time: new Date(r.check_in).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
        action: "Vào ca",
        status: "Thành công"
      });
    }
    if (r.check_out) {
      history.push({
        id: `${r.id}-out`,
        time: new Date(r.check_out).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
        action: "Ra ca",
        status: "Thành công"
      });
    }
  });

  return history.sort((a, b) => a.time.localeCompare(b.time));
}

/* ────────── Shifts ────────── */
async function getShifts(): Promise<Shift[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "s1", name: "Ca sáng", time: "08:00 - 16:00", employees: 12, status: "Đang diễn ra" },
      { id: "s2", name: "Ca chiều", time: "14:00 - 22:00", employees: 10, status: "Sắp tới" },
      { id: "s3", name: "Ca gãy", time: "10:00 - 14:00 / 18:00 - 22:00", employees: 6, status: "Linh hoạt" },
      { id: "s4", name: "Ca đêm", time: "22:00 - 06:00", employees: 4, status: "Đêm nay" },
    ];
  }

  const { data, error } = await supabase
    .from("work_shifts")
    .select("id, name, start_time, end_time")
    .eq("is_deleted", false)
    .order("start_time");

  if (error || !data) return [];

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTime = currentHour * 60 + currentMin;

  return data.map((s: any) => {
    const startHour = parseInt(s.start_time.slice(0, 2));
    const startMin = parseInt(s.start_time.slice(3, 5));
    const startTime = startHour * 60 + startMin;

    const endHour = parseInt(s.end_time.slice(0, 2));
    const endMin = parseInt(s.end_time.slice(3, 5));
    let endTime = endHour * 60 + endMin;
    if (endTime < startTime) endTime += 24 * 60; // Overnight shift

    let statusStr = "Sắp tới";
    let checkTime = currentTime;
    if (checkTime < startTime && endTime >= 24 * 60) checkTime += 24 * 60; // Shift is overnight, current time is past midnight
    
    if (checkTime >= startTime && checkTime <= endTime) statusStr = "Đang diễn ra";
    else if (checkTime > endTime) statusStr = "Đã kết thúc";

    return {
      id: s.id,
      name: s.name,
      time: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
      employees: Math.floor(Math.random() * 5) + 5, // Mock number for now
      status: statusStr
    };
  });
}

/* ────────── Leaves ────────── */
async function getLeaveRequests(): Promise<LeaveRequest[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", type: "Phép năm", from: "20/05/2026", to: "22/05/2026", days: 3, status: "Chờ duyệt", reason: "Về quê thăm gia đình" },
      { id: "2", type: "Nghỉ ốm", from: "10/05/2026", to: "10/05/2026", days: 1, status: "Đã duyệt", reason: "Không khoẻ" },
      { id: "3", type: "Nghỉ cưới", from: "01/04/2026", to: "03/04/2026", days: 3, status: "Đã duyệt", reason: "Đám cưới" },
      { id: "4", type: "Phép năm", from: "15/03/2026", to: "15/03/2026", days: 1, status: "Từ chối", reason: "Việc riêng" },
    ];
  }

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("leave_requests")
    .select(`
      id, from_date, to_date, total_days, reason, status,
      leave_types:leave_type_id(name)
    `)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => {
    let statusStr = "Chờ duyệt";
    if (r.status === "approved") statusStr = "Đã duyệt";
    if (r.status === "rejected") statusStr = "Từ chối";

    return {
      id: r.id,
      type: r.leave_types?.name || "Khác",
      from: new Date(r.from_date).toLocaleDateString("vi-VN"),
      to: new Date(r.to_date).toLocaleDateString("vi-VN"),
      days: Number(r.total_days),
      status: statusStr,
      reason: r.reason || ""
    };
  });
}

/* ────────── Payroll ────────── */
async function getPayroll(): Promise<PayrollData> {
  if (!isSupabaseConfigured) {
    return {
      latest: {
        periodName: "Tháng 5/2026",
        items: [
          { label: "Lương cơ bản", amount: 15000000 },
          { label: "Phụ cấp", amount: 3000000 },
          { label: "Thưởng", amount: 2000000 },
          { label: "Làm thêm giờ", amount: 1500000 },
          { label: "Khấu trừ BHXH", amount: 1200000, deduct: true },
          { label: "Thuế TNCN", amount: 500000, deduct: true },
        ],
        netSalary: 19800000
      },
      history: [
        { period: "Tháng 5/2026", net: 19800000, status: "Đã chi" },
        { period: "Tháng 4/2026", net: 18500000, status: "Đã chi" },
        { period: "Tháng 3/2026", net: 19200000, status: "Đã chi" },
      ]
    };
  }

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { latest: null, history: [] };
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return { latest: null, history: [] };

  const { data, error } = await supabase
    .from("payroll_items")
    .select(`
      id, base_salary, allowance, overtime_pay, bonus, deduction, insurance, tax, net_salary, status,
      payroll_periods ( name, start_date )
    `)
    .eq("employee_id", employeeId)
    .order("payroll_periods(start_date)", { ascending: false });

  if (error || !data || data.length === 0) return { latest: null, history: [] };

  // Format the latest one
  const latestData = data[0] as any;
  const periodName = latestData.payroll_periods?.name || "Kỳ lương hiện tại";
  
  const latest: PayrollDetail = {
    periodName,
    items: [
      { label: "Lương cơ bản", amount: Number(latestData.base_salary) },
      { label: "Phụ cấp", amount: Number(latestData.allowance) },
      { label: "Làm thêm giờ", amount: Number(latestData.overtime_pay) },
      { label: "Thưởng", amount: Number(latestData.bonus) },
      { label: "Bảo hiểm", amount: Number(latestData.insurance), deduct: true },
      { label: "Thuế TNCN", amount: Number(latestData.tax), deduct: true },
      { label: "Khấu trừ khác", amount: Number(latestData.deduction), deduct: true },
    ].filter(i => i.amount > 0), // Only show non-zero items
    netSalary: Number(latestData.net_salary)
  };

  const history: PayrollHistoryItem[] = data.map((p: any) => {
    let s = "Đã tính";
    if (p.status === "approved") s = "Đã duyệt";
    if (p.status === "paid") s = "Đã chi";
    return {
      period: p.payroll_periods?.name || "Kỳ lương",
      net: Number(p.net_salary),
      status: s
    };
  });

  return { latest, history };
}

/* ────────── Performance ────────── */
async function getKpis(): Promise<KpiItem[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", name: "Tỷ lệ hiện diện", target: "95%", actual: "96%", score: 101, status: "Đạt" },
      { id: "2", name: "Đúng giờ", target: "90%", actual: "92%", score: 102, status: "Đạt" },
      { id: "3", name: "Hoàn thành OKR", target: "80%", actual: "78%", score: 97, status: "Gần đạt" },
      { id: "4", name: "CSKH", target: "4.5/5", actual: "4.7/5", score: 104, status: "Xuất sắc" },
      { id: "5", name: "Đào tạo", target: "100%", actual: "84%", score: 84, status: "Chưa đạt" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("kpis")
    .select("id, name, target_value, actual_value, unit, score")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((k: any) => {
    let statusStr = "Gần đạt";
    const score = Number(k.score) || 0;
    if (score >= 105) statusStr = "Xuất sắc";
    else if (score >= 100) statusStr = "Đạt";
    else if (score < 90) statusStr = "Chưa đạt";

    const isRatio = k.unit === "ratio" || k.unit === "/5" || k.unit === "/10";
    const unitDisplay = k.unit === "ratio" ? "" : k.unit;

    return {
      id: k.id,
      name: k.name,
      target: `${k.target_value}${unitDisplay}`,
      actual: `${k.actual_value}${unitDisplay}`,
      score: score,
      status: statusStr
    };
  });
}

async function getOkrs(): Promise<OkrObjective[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", title: "Nâng cao chất lượng tuyển dụng", quarter: "Q2/2026", progress: 65, krs: [
        { title: "Giảm thời gian tuyển dụng xuống <15 ngày", progress: 80 },
        { title: "Tỷ lệ ứng viên qua probation >85%", progress: 50 },
      ]},
      { id: "2", title: "Cải thiện tỷ lệ giữ chân nhân sự", quarter: "Q2/2026", progress: 40, krs: [
        { title: "Turnover rate <5%/quý", progress: 60 },
        { title: "eNPS >30", progress: 20 },
      ]},
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("okr_objectives")
    .select(`
      id, title, period_code, progress,
      okr_key_results ( title, target_value, current_value )
    `)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((o: any) => {
    return {
      id: o.id,
      title: o.title,
      quarter: o.period_code || "Q2/2026",
      progress: Number(o.progress),
      krs: (o.okr_key_results || []).map((kr: any) => {
        const target = Number(kr.target_value) || 1;
        const current = Number(kr.current_value) || 0;
        const krProg = Math.round((current / target) * 100);
        return {
          title: kr.title,
          progress: Math.min(krProg, 100)
        };
      })
    };
  });
}

async function getReviews(): Promise<PerformanceReview[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", period: "Q1/2026", reviewer: "Trần Văn Bình", score: 4.5, feedback: "Hoàn thành tốt công việc, chủ động trong các dự án HR", status: "Hoàn tất" },
      { id: "2", period: "Q4/2025", reviewer: "Trần Văn Bình", score: 4.2, feedback: "Cần cải thiện kỹ năng giao tiếp với team Bếp", status: "Hoàn tất" },
      { id: "3", period: "Q2/2026", reviewer: "—", score: 0, feedback: "", status: "Chưa bắt đầu" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("performance_reviews")
    .select(`
      id, period_code, score, feedback, status,
      reviewer:reviewer_id ( profiles ( full_name ) )
    `)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => {
    let reviewerName = "—";
    if (r.reviewer?.profiles?.[0]?.full_name) {
      reviewerName = r.reviewer.profiles[0].full_name;
    }

    let statusStr = "Chưa bắt đầu";
    if (r.status === "completed" || r.status === "approved") statusStr = "Hoàn tất";
    else if (r.status === "pending") statusStr = "Đang chờ";

    return {
      id: r.id,
      period: r.period_code || "Kỳ đánh giá",
      reviewer: reviewerName,
      score: Number(r.score) || 0,
      feedback: r.feedback || "",
      status: statusStr
    };
  });
}

/* ────────── Approvals ────────── */
async function getApprovals(): Promise<ApprovalRequest[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", title: "Đơn nghỉ phép", employee: "Nguyễn Minh Anh", code: "NV023", type: "Nghỉ phép", date: "20/05 - 22/05", status: "Chờ duyệt" },
      { id: "2", title: "Điều chỉnh chấm công", employee: "Trần Gia Hân", code: "NV045", type: "Chấm công", date: "15/05", status: "Chờ duyệt" },
      { id: "3", title: "Đăng ký tăng ca", employee: "Phạm Quốc Bảo", code: "NV012", type: "Tăng ca", date: "18/05", status: "Chờ duyệt" },
      { id: "4", title: "Đơn đổi ca", employee: "Lê Thuỳ Linh", code: "NV067", type: "Đổi ca", date: "19/05", status: "Chờ duyệt" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("approval_requests")
    .select(`
      id, request_type, status, created_at,
      requester:requester_id ( employee_code, profiles ( full_name ) )
    `)
    .eq("current_approver_id", employeeId) // Only fetch requests assigned to this user to approve
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => {
    let employeeName = "—";
    if (r.requester?.profiles?.[0]?.full_name) {
      employeeName = r.requester.profiles[0].full_name;
    }

    let statusStr = "Chờ duyệt";
    if (r.status === "approved") statusStr = "Đã duyệt";
    if (r.status === "rejected") statusStr = "Từ chối";

    const typeMapping: Record<string, string> = {
      "leave": "Nghỉ phép",
      "overtime": "Tăng ca",
      "shift_change": "Đổi ca",
      "attendance": "Chấm công"
    };

    return {
      id: r.id,
      title: `Đơn ${typeMapping[r.request_type] || r.request_type}`,
      employee: employeeName,
      code: r.requester?.employee_code || "N/A",
      type: typeMapping[r.request_type] || r.request_type,
      date: new Date(r.created_at).toLocaleDateString("vi-VN"),
      status: statusStr
    };
  });
}

/* ────────── Training ────────── */
async function getTrainingCourses(): Promise<TrainingCourse[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", title: "Kỹ năng phục vụ nâng cao", progress: 75, status: "Đang học", deadline: "30/05/2026" },
      { id: "2", title: "VSATTP cơ bản", progress: 100, status: "Hoàn thành", deadline: "15/04/2026" },
      { id: "3", title: "Kỹ năng giao tiếp", progress: 30, status: "Đang học", deadline: "15/06/2026" },
      { id: "4", title: "Quản lý thời gian", progress: 0, status: "Chưa bắt đầu", deadline: "30/06/2026" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("training_enrollments")
    .select(`
      id, progress, status,
      training_courses ( title, end_date )
    `)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((e: any) => {
    let statusStr = "Chưa bắt đầu";
    const prog = Number(e.progress) || 0;
    if (prog >= 100 || e.status === "approved" || e.status === "completed") {
      statusStr = "Hoàn thành";
    } else if (prog > 0 || e.status === "pending") {
      statusStr = "Đang học";
    }

    let deadlineStr = "Không thời hạn";
    if (e.training_courses?.end_date) {
      deadlineStr = new Date(e.training_courses.end_date).toLocaleDateString("vi-VN");
    }

    return {
      id: e.id,
      title: e.training_courses?.title || "Khóa học",
      progress: prog,
      status: statusStr,
      deadline: deadlineStr
    };
  });
}

/* ────────── Notifications ────────── */
async function getNotifications(): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", title: "Ca làm mới được phân công", body: "Ca sáng ngày mai 22/05 đã được phân công cho bạn", time: "5 phút trước", read: false, type: "info" },
      { id: "2", title: "Đơn nghỉ phép đã được duyệt", body: "Quản lý đã phê duyệt đơn nghỉ phép 20-22/05", time: "1 giờ trước", read: false, type: "success" },
      { id: "3", title: "Cảnh báo chấm công muộn", body: "Bạn vào ca trễ 12 phút ngày 19/05", time: "3 giờ trước", read: true, type: "warning" },
      { id: "4", title: "Bảng lương tháng 5 đã phát hành", body: "Vui lòng kiểm tra chi tiết trong mục Bảng lương", time: "5 giờ trước", read: true, type: "payroll" },
      { id: "5", title: "Khóa đào tạo mới", body: "Kỹ năng phục vụ nâng cao — đăng ký trước 25/05", time: "1 ngày trước", read: true, type: "info" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  const employeeId = profile?.employee_id;
  if (!employeeId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, type, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((n: any) => {
    // Basic time ago logic
    const createdDate = new Date(n.created_at);
    const diff = Math.floor((new Date().getTime() - createdDate.getTime()) / 1000);
    let timeAgo = "";
    if (diff < 60) timeAgo = "Vừa xong";
    else if (diff < 3600) timeAgo = `${Math.floor(diff / 60)} phút trước`;
    else if (diff < 86400) timeAgo = `${Math.floor(diff / 3600)} giờ trước`;
    else timeAgo = `${Math.floor(diff / 86400)} ngày trước`;

    let nType = "info";
    if (n.type === "approval_status" || n.title.toLowerCase().includes("duyệt")) nType = "success";
    if (n.type === "alert" || n.title.toLowerCase().includes("cảnh báo")) nType = "warning";
    if (n.type === "payroll" || n.title.toLowerCase().includes("lương")) nType = "payroll";

    return {
      id: n.id,
      title: n.title,
      body: n.body || "",
      time: timeAgo,
      read: n.is_read,
      type: nType
    };
  });
}

/* ────────── Documents ────────── */
async function getDocuments(): Promise<AppDocument[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", title: "Hợp đồng lao động", type: "Hợp đồng", url: "#", size: 2400000, date: "01/06/2022", status: "Đã ký" },
      { id: "2", title: "Phụ lục HĐ lần 1", type: "Phụ lục", url: "#", size: 1100000, date: "01/06/2023", status: "Đã ký" },
      { id: "3", title: "Quyết định bổ nhiệm", type: "Quyết định", url: "#", size: 890000, date: "15/01/2024", status: "Đã ký" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  if (!profile?.employee_id) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("employee_id", profile.employee_id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    title: d.title,
    type: d.document_type || "Tài liệu",
    url: d.file_url || "#",
    size: Number(d.file_size_bytes) || 0,
    date: new Date(d.created_at).toLocaleDateString("vi-VN"),
    status: "Đã nộp"
  }));
}

/* ────────── Activity Logs ────────── */
async function getActivityLogs(): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", action: "Tạo đơn nghỉ phép", actor: "Nguyễn Minh Anh", module: "Nghỉ phép", time: "14:30 · Hôm nay" },
      { id: "2", action: "Chấm công vào ca", actor: "Phạm Quốc Bảo", module: "Chấm công", time: "08:01 · Hôm nay" },
    ];
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      id, action, target_table, created_at,
      actor:actor_id ( profiles ( full_name ) )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((l: any) => {
    let actorName = "Hệ thống";
    if (l.actor?.profiles?.[0]?.full_name) actorName = l.actor.profiles[0].full_name;
    
    // Formatting time
    const createdDate = new Date(l.created_at);
    const diff = Math.floor((new Date().getTime() - createdDate.getTime()) / 1000);
    let timeStr = "";
    if (diff < 86400) {
      timeStr = `${createdDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} · Hôm nay`;
    } else {
      timeStr = `${createdDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} · ${createdDate.toLocaleDateString("vi-VN")}`;
    }

    return {
      id: l.id,
      action: l.action,
      actor: actorName,
      module: l.target_table || "Hệ thống",
      time: timeStr
    };
  });
}

/* ────────── Benefits ────────── */
async function getBenefits(): Promise<EmployeeBenefit[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "1", name: "Bảo hiểm y tế PVI", description: "Gói sức khỏe toàn diện", amount: 5000000, status: "Đang hiệu lực" },
      { id: "2", name: "Trợ cấp ăn trưa", description: "Hỗ trợ 50k/ngày", amount: 1500000, status: "Đang hiệu lực" },
    ];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).single();
  if (!profile?.employee_id) return [];

  const { data, error } = await supabase
    .from("employee_benefits")
    .select(`
      id, status,
      benefits ( name, description, amount )
    `)
    .eq("employee_id", profile.employee_id);

  if (error || !data) return [];

  return data.map((b: any) => {
    let statusStr = "Chờ duyệt";
    if (b.status === "approved") statusStr = "Đang hiệu lực";
    else if (b.status === "rejected") statusStr = "Từ chối";

    return {
      id: b.id,
      name: b.benefits?.name || "Phúc lợi",
      description: b.benefits?.description || "",
      amount: Number(b.benefits?.amount) || 0,
      status: statusStr
    };
  });
}

/* ────────── Export ────────── */
export const hrData = {
  employees: {
    list: getEmployees,
    getById: getEmployeeById,
  },
  dashboard: {
    stats: getDashboardStats,
  },
  departments: {
    list: getDepartments,
  },
  candidates: {
    list: getCandidates,
  },
  attendance: {
    history: getAttendanceHistory,
  },
  shifts: {
    list: getShifts,
  },
  leaves: {
    list: getLeaveRequests,
  },
  payroll: {
    get: getPayroll,
  },
  performance: {
    kpis: getKpis,
    okrs: getOkrs,
    reviews: getReviews,
  },
  approvals: {
    list: getApprovals,
  },
  training: {
    list: getTrainingCourses,
  },
  notifications: {
    list: getNotifications,
  },
  documents: {
    list: getDocuments,
  },
  activityLogs: {
    list: getActivityLogs,
  },
  benefits: {
    list: getBenefits,
  }
};
