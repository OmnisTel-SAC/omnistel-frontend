import { Directive, ElementRef, inject, Input, OnInit, OnDestroy } from '@angular/core';

export type ScrollAnimationType = 'fade-in-up' | 'fade-in-left' | 'fade-in-right' | 'scale-in';

@Directive({
  selector: '[appScrollAnimation]',
  standalone: true
})
export class ScrollAnimationDirective implements OnInit, OnDestroy {
  @Input() appScrollAnimation: ScrollAnimationType = 'fade-in-up';
  @Input() delay = 0;
  @Input() duration = 600;

  private el = inject(ElementRef).nativeElement as HTMLElement;
  private observer: IntersectionObserver | null = null;

  ngOnInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              this.el.classList.add('animate-visible', this.appScrollAnimation);
            }, this.delay);
            this.observer?.unobserve(this.el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    this.el.classList.add('animate-hidden');
    this.observer.observe(this.el);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
