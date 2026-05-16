-- 更新 admin/owner 用户积分为 100000
UPDATE users 
SET "pointsBalance" = 100000 
WHERE role = 'ADMIN' OR role = 'OWNER';

-- 验证更新结果
SELECT id, email, role, "pointsBalance" 
FROM users 
WHERE role = 'ADMIN' OR role = 'OWNER';
