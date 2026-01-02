/**
 * 速率限制器
 * 用于限制 API 调用频率，防止滥用
 */

interface RateLimitConfig {
  maxRequests: number;  // 最大请求数
  timeWindow: number;   // 时间窗口（毫秒）
}

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests = 10, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  /**
   * 检查是否可以发起请求
   * @returns 是否允许请求
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // 清理过期的请求记录
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  /**
   * 获取剩余请求次数
   * @returns 剩余请求次数
   */
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * 获取下次可以请求的时间
   * @returns 下次可以请求的时间戳，如果可以立即请求则返回 0
   */
  getNextAvailableTime(): number {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    const now = Date.now();
    const oldestRequest = this.requests[0];
    const nextAvailable = oldestRequest + this.timeWindow;

    return Math.max(0, nextAvailable - now);
  }

  /**
   * 重置速率限制器
   */
  reset(): void {
    this.requests = [];
  }
}

// 创建全局速率限制器实例
export const syncRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
export const apiRateLimiter = new RateLimiter(30, 60000);  // 30 requests per minute

export { RateLimiter };
