// iPhone-specific interaction utilities

export class iPhoneInteractions {
  // Haptic feedback patterns
  static hapticPatterns = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 50, 30, 50, 30],
    selection: 15,
    impact: 25,
  };

  // Trigger haptic feedback
  static haptic(pattern: keyof typeof iPhoneInteractions.hapticPatterns | number | number[]): void {
    if ('vibrate' in navigator) {
      const vibrationPattern = typeof pattern === 'string' 
        ? this.hapticPatterns[pattern] 
        : pattern;
      
      navigator.vibrate(vibrationPattern);
    }
  }

  // Check if running on iPhone
  static isIPhone(): boolean {
    return /iPhone/i.test(navigator.userAgent) || 
           (window.innerWidth <= 428 && window.innerHeight >= 800);
  }

  // Check if device supports haptic feedback
  static supportsHaptic(): boolean {
    return 'vibrate' in navigator && this.isIPhone();
  }

  // Enhanced touch feedback with haptic and visual
  static touchFeedback(
    element: HTMLElement, 
    pattern: keyof typeof iPhoneInteractions.hapticPatterns = 'light'
  ): void {
    // Add visual feedback
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease';
    
    // Trigger haptic feedback
    this.haptic(pattern);
    
    // Reset visual feedback
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 100);
  }

  // Native-feeling scroll with momentum
  static enableNativeScroll(container: HTMLElement): void {
    (container.style as any).webkitOverflowScrolling = 'touch';
    container.style.scrollBehavior = 'smooth';
    
    // Add scroll indicators for iOS
    (container.style as any).scrollbarWidth = 'none';
    (container.style as any).msOverflowStyle = 'none';
    
    // Hide scrollbars but keep functionality
    const style = document.createElement('style');
    style.textContent = `
      ${container.tagName.toLowerCase()}::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Prevent zoom on input focus (iOS specific)
  static preventInputZoom(): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      (input as HTMLElement).style.fontSize = '16px';
      input.addEventListener('focus', () => {
        (input as HTMLElement).style.fontSize = '16px';
      });
    });
  }

  // Safe area utilities
  static getSafeAreas() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
      right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
      bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: style.getPropertyValue('env(safe-area-inset-left)') || '0px',
    };
  }

  // Pull-to-refresh prevention
  static preventPullToRefresh(): void {
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
      if (document.body.scrollTop === 0) {
        startY = e.touches[0].pageY;
        isPulling = true;
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (isPulling && e.touches[0].pageY > startY + 50) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      isPulling = false;
    });
  }

  // Status bar management for web apps
  static setStatusBarColor(color: string): void {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (meta) {
      meta.content = color;
    }
  }

  // Initialize all iPhone optimizations
  static initialize(): void {
    if (this.isIPhone()) {
      this.preventInputZoom();
      this.preventPullToRefresh();
      this.setStatusBarColor('#000000');
      
      // Add iPhone-specific body class
      document.body.classList.add('iphone-optimized');
      
      console.log('📱 iPhone optimizations initialized');
    }
  }
}

// React hook for iPhone interactions
export const useIPhoneInteractions = () => {
  const haptic = iPhoneInteractions.haptic;
  const isIPhone = iPhoneInteractions.isIPhone();
  const supportsHaptic = iPhoneInteractions.supportsHaptic();

  return {
    haptic,
    isIPhone,
    supportsHaptic,
    touchFeedback: iPhoneInteractions.touchFeedback,
    enableNativeScroll: iPhoneInteractions.enableNativeScroll,
    getSafeAreas: iPhoneInteractions.getSafeAreas,
  };
};

// Export default for easy importing
export default iPhoneInteractions;
