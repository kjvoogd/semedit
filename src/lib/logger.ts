type Level = 'error' | 'info' | 'debug' | 'trace';

const LEVEL_RANK: Record<Level, number> = { error: 0, info: 1, debug: 2, trace: 3 };

class Logger {
  constructor(private level: Level = 'debug') {}

  error(...args: unknown[]): void {
    if (LEVEL_RANK['error'] <= LEVEL_RANK[this.level]) console.error('[error]', ...args);
  }

  info(...args: unknown[]): void {
    if (LEVEL_RANK['info'] <= LEVEL_RANK[this.level]) console.log('[info]', ...args);
  }

  debug(...args: unknown[]): void {
    if (LEVEL_RANK['debug'] <= LEVEL_RANK[this.level]) console.log('[debug]', ...args);
  }

  trace(...args: unknown[]): void {
    if (LEVEL_RANK['trace'] <= LEVEL_RANK[this.level]) console.log('[trace]', ...args);
  }
}

export const logger = new Logger('info');
