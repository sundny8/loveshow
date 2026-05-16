const postgres = require('postgres');

async function updateAdminPoints() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    // 查询 admin 用户
    const users = await client`SELECT id, email, role, points_balance FROM users WHERE role = 'ADMIN' OR role = 'OWNER' LIMIT 5`;
    console.log('Admin users before update:', users);
    
    // 更新积分
    const result = await client`UPDATE users SET points_balance = 100000 WHERE role = 'ADMIN' OR role = 'OWNER'`;
    console.log('Updated rows:', result.count);
    
    // 验证更新
    const updated = await client`SELECT id, email, role, points_balance FROM users WHERE role = 'ADMIN' OR role = 'OWNER'`;
    console.log('Admin users after update:', updated);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateAdminPoints();
