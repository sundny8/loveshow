// 临时脚本：诊断 R2 凭据对各桶的读写权限
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const buckets = [env.R2_BUCKET, 'imagehouse'].filter(Boolean);
const testKey = 'generated/_r2_permission_test.txt';

for (const bucket of buckets) {
  console.log(`\n===== bucket: ${bucket} =====`);
  // List
  try {
    const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 3 }));
    console.log(`  LIST  ✓ (${res.KeyCount} keys shown)`);
    for (const o of res.Contents || []) console.log(`         - ${o.Key}`);
  } catch (e) {
    console.log(`  LIST  ✗ ${e.name}: ${e.message}`);
  }
  // Put
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: testKey, Body: Buffer.from('test'), ContentType: 'text/plain' }));
    console.log('  PUT   ✓');
  } catch (e) {
    console.log(`  PUT   ✗ ${e.name}: ${e.message}`);
  }
  // Get
  try {
    await client.send(new GetObjectCommand({ Bucket: bucket, Key: testKey }));
    console.log('  GET   ✓');
  } catch (e) {
    console.log(`  GET   ✗ ${e.name}: ${e.message}`);
  }
  // 清理测试对象
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    console.log('  DEL   ✓ (test object cleaned)');
  } catch {
    /* ignore */
  }
}
