import pLimit from 'p-limit';
import { runPhotoPipeline, type PipelineOptions, type PipelineResult } from './pipeline';

const DEFAULT_CONCURRENCY = Number(process.env.PHOTO_BATCH_CONCURRENCY || 3);
const limit = pLimit(DEFAULT_CONCURRENCY);

/**
 * 进程内批量调度器（简化版）。
 * 生产环境建议替换为 Redis + BullMQ 或专用队列服务。
 */
export function schedulePipeline(
  input: Buffer,
  options: PipelineOptions
): Promise<PipelineResult> {
  return limit(() => runPhotoPipeline(input, options));
}

export function currentPressure(): { active: number; pending: number } {
  return { active: limit.activeCount, pending: limit.pendingCount };
}
