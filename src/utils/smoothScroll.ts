// utils/smoothScroll.ts
export const smoothScrollToElement = (elementId: string, duration: number = 800) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return false;
  }

  const startPosition = window.pageYOffset;
  const elementRect = element.getBoundingClientRect();
  const targetPosition = startPosition + elementRect.top - (window.innerHeight / 2) + (elementRect.height / 2);
  const distance = targetPosition - startPosition;
  
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Easing function para suavizar (easeInOutCubic)
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    window.scrollTo(0, startPosition + distance * ease(progress));
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
  return true;
};