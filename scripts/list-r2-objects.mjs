// 临时脚本：列出 R2 桶中的对象，用于定位数据库 dump 备份文件
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';

// 手动解析 .env.local（避免依赖 dotenv）
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

let token = undefined;
const all = [];
do {
  const res = await client.send(
    new ListObjectsV2Command({ Bucket: env.R2_BUCKET, ContinuationToken: token })
  );
  all.push(...(res.Contents || []));
  token = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (token);

console.log(`Total objects: ${all.length}\n`);
// 优先显示疑似数据库备份的文件
const dumps = all.filter((o) =>
  /\.(sql|dump|backup|tar|gz|bak|custom)(\.|$)/i.test(o.Key) ||
  /dump|backup|pgdata|db/i.test(o.Key)
);
console.log('--- 疑似数据库备份文件 ---');
for (const o of dumps) {
  console.log(`${o.Key}\t${(o.Size / 1024 / 1024).toFixed(2)} MB\t${o.LastModified?.toISOString()}`);
}
if (dumps.length === 0) {
  console.log('(未找到，以下为全部对象前 50 条)');
  for (const o of all.slice(0, 50)) {
    console.log(`${o.Key}\t${(o.Size / 1024).toFixed(1)} KB`);
  }
}
