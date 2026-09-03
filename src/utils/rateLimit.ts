/**
 * 速率限制器
 * 用于限制 API 调用频率，防止滥用
 */

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

}

// 创建全局速率限制器实例
export const syncRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

export { RateLimiter };
