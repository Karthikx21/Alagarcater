import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';        // any winston/pino instance works

/* ────────────────────────────────────────────────────────────
 * 1.  Performance-monitor middleware
 *    – logs “slow” (>1 s) and “critical” (>5 s) requests
 *    – avoids overriding res.end; uses res.once('finish')
 * ──────────────────────────────────────────────────────────── */
export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startTime = process.hrtime.bigint();          // hi-res time
  const startHeap  = process.memoryUsage().heapUsed;  // bytes

  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    const heapDelta  = process.memoryUsage().heapUsed - startHeap;

    if (durationMs > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url:    req.originalUrl,
        status: res.statusCode,
        duration: `${durationMs.toFixed(2)} ms`,
        heapChange: `${(heapDelta / 1024 / 1024).toFixed(2)} MB`,
        ip:     req.ip,
        agent:  req.get('user-agent'),
      });
    }
    if (durationMs > 5000) {
      logger.error('Critical performance issue', {
        method: req.method,
        url:    req.originalUrl,
        status: res.statusCode,
        duration: `${durationMs.toFixed(2)} ms`,
        heapChange: `${(heapDelta / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  });

  next();
}

/* ────────────────────────────────────────────────────────────
 * 2.  /health handler
 *    – returns process metrics + DB check
 * ──────────────────────────────────────────────────────────── */
export async function healthCheck(req: Request, res: Response) {
  const mem   = process.memoryUsage();
  const cpu   = process.cpuUsage();
  const uptime = process.uptime();
  const memPct = (mem.heapUsed / mem.heapTotal) * 100;

  const db = await checkDatabaseHealth();   // see §5 below

  const health = {
    status:
      memPct > 90 || db.status === 'unhealthy' ? 'warning' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      human: formatUptime(uptime),
    },
    memory: {
      rss:        bytesToMb(mem.rss),
      heapTotal:  bytesToMb(mem.heapTotal),
      heapUsed:   bytesToMb(mem.heapUsed),
      external:   bytesToMb(mem.external),
      usage:      `${memPct.toFixed(2)} %`,
    },
    cpu,
    env:  process.env.NODE_ENV ?? 'development',
    node: process.version,
    pid:  process.pid,
    database: db,
  };

  if (memPct > 90) {
    logger.warn('High memory usage detected', { usagePercent: memPct.toFixed(2) });
  }

  res.status(200).json(health);
}

/* ────────────────────────────────────────────────────────────
 * 3.  Periodic memory monitor
 * ──────────────────────────────────────────────────────────── */
export function startMemoryMonitoring() {
  const interval = Number(process.env.MEMORY_MONITOR_INTERVAL ?? 300_000); // 5 min

  setInterval(() => {
    const m   = process.memoryUsage();
    const pct = (m.heapUsed / m.heapTotal) * 100;

    logger.info('Memory usage', {
      rss:       bytesToMb(m.rss),
      heapUsed:  bytesToMb(m.heapUsed),
      heapTotal: bytesToMb(m.heapTotal),
      usage:     `${pct.toFixed(2)} %`,
    });

    if (pct > 80 && typeof global.gc === 'function') {
      logger.warn('High memory usage – forcing GC');
      global.gc();
    }
  }, interval);
}

/* ────────────────────────────────────────────────────────────
 * 4.  Request-size limiter
 *    – works even when Content-Length header is missing
 * ──────────────────────────────────────────────────────────── */
export function requestSizeLimit(maxBytes = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Fast-path for GET/HEAD/OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        logger.warn('Request body too large', {
          method: req.method,
          url:    req.originalUrl,
          size:   total,
          limit:  maxBytes,
        });
        res
          .status(413)
          .json({ error: 'Request entity too large', maxSize: bytesToMb(maxBytes) });
        req.destroy();
      }
    });
    req.on('end', () => next());
  };
}

/* ────────────────────────────────────────────────────────────
 * 5.  DB health check (Prisma example – adapt as needed)
 * ──────────────────────────────────────────────────────────── */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() - started };
  } catch (err) {
    logger.error('DB health check failed', { err });
    return {
      status: 'unhealthy',
      error:  err instanceof Error ? err.message : 'unknown error',
    };
  }
}

/* ────────────────────────────────────────────────────────────
 * 6.  Helper utils
 * ──────────────────────────────────────────────────────────── */
function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86_400);
  const h = Math.floor((sec % 86_400) / 3_600);
  const m = Math.floor((sec % 3_600) / 60);
  const s = Math.floor(sec % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, s && `${s}s`]
    .filter(Boolean)
    .join(' ') || '0s';
}

function bytesToMb(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}