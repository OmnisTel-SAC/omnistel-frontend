import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CountUpService {
  animateValue(element: HTMLElement, start: number, end: number, duration: number = 2000) {
    const startTime = performance.now();
    const suffix = element.dataset['suffix'] ?? '';

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(start + (end - start) * easeOutQuart);
      element.textContent = this.formatNumber(currentValue) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      const hundreds = Math.floor((num % 1000) / 100);
      return `${thousands},${hundreds}00+`;
    }
    return num.toString();
  }
}
