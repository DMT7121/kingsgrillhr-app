-- ==============================================================================
-- TRIGGER: Tự động tạo Profile khi có User đăng ký mới từ Supabase Auth
-- ==============================================================================

-- 1. Tạo hàm xử lý trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'admin', -- Đặt mặc định là admin cho tài khoản đầu tiên để dễ test, sau đó sửa lại
    'active'
  );
  RETURN NEW;
END;
$$;

-- 2. Đảm bảo xóa trigger cũ nếu đã tồn tại để tránh lỗi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Tạo Trigger lắng nghe sự kiện INSERT trên auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
