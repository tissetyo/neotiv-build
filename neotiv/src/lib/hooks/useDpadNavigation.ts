'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * D-pad spatial navigation hook for TV dashboard.
 * Manages keyboard-based focus traversal using ArrowUp/Down/Left/Right,
 * Enter for activation, and Escape for closing modals.
 * 
 * Also handles STB cursor snapping: when the Android system cursor
 * moves via D-pad (generating mousemove events), this hook
 * intercepts the movement and snaps focus to the nearest widget.
 */
export function useDpadNavigation(options?: {
  enabled?: boolean;
  onEscape?: () => void;
  selector?: string;
}) {
  const { enabled = true, onEscape, selector = '.tv-focusable' } = options || {};
  const currentIndexRef = useRef<number>(-1);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const mouseThrottleRef = useRef<number>(0);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    // Filter out hidden/invisible elements
    return elements.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
  }, [selector]);

  const getCenter = (el: HTMLElement): { x: number; y: number } => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const findNearest = useCallback(
    (
      current: HTMLElement,
      direction: 'up' | 'down' | 'left' | 'right',
      elements: HTMLElement[]
    ): HTMLElement | null => {
      const currentCenter = getCenter(current);
      const currentRect = current.getBoundingClientRect();
      let best: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const el of elements) {
        if (el === current) continue;
        const elCenter = getCenter(el);
        const elRect = el.getBoundingClientRect();

        // Check direction validity
        let isValid = false;
        switch (direction) {
          case 'up':
            isValid = elCenter.y < currentCenter.y - 5;
            break;
          case 'down':
            isValid = elCenter.y > currentCenter.y + 5;
            break;
          case 'left':
            isValid = elCenter.x < currentCenter.x - 5;
            break;
          case 'right':
            isValid = elCenter.x > currentCenter.x + 5;
            break;
        }

        if (!isValid) continue;

        // Calculate score: distance with directional bias
        const dx = elCenter.x - currentCenter.x;
        const dy = elCenter.y - currentCenter.y;

        let score: number;
        if (direction === 'up' || direction === 'down') {
          // Prefer elements directly above/below (penalize horizontal offset)
          score = Math.abs(dy) + Math.abs(dx) * 2.5;
        } else {
          // Prefer elements directly left/right (penalize vertical offset)
          score = Math.abs(dx) + Math.abs(dy) * 2.5;
        }

        // Bonus for elements that overlap on the cross-axis
        if (direction === 'up' || direction === 'down') {
          const overlapX = Math.max(
            0,
            Math.min(currentRect.right, elRect.right) - Math.max(currentRect.left, elRect.left)
          );
          if (overlapX > 0) score -= overlapX * 0.5;
        } else {
          const overlapY = Math.max(
            0,
            Math.min(currentRect.bottom, elRect.bottom) - Math.max(currentRect.top, elRect.top)
          );
          if (overlapY > 0) score -= overlapY * 0.5;
        }

        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }

      return best;
    },
    []
  );

  /**
   * Find the closest focusable element to a given point.
   */
  const findClosestToPoint = useCallback(
    (x: number, y: number, elements: HTMLElement[]): HTMLElement | null => {
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Calculate distance from point to nearest edge of element
        const cx = Math.max(rect.left, Math.min(x, rect.right));
        const cy = Math.max(rect.top, Math.min(y, rect.bottom));
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < bestDist) {
          bestDist = dist;
          best = el;
        }
      }
      return best;
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      const currentFocused = elements.includes(activeElement) ? activeElement : null;

      const isUp = e.key === 'ArrowUp' || e.key === 'Up' || e.keyCode === 38 || e.keyCode === 19;
      const isDown = e.key === 'ArrowDown' || e.key === 'Down' || e.keyCode === 40 || e.keyCode === 20;
      const isLeft = e.key === 'ArrowLeft' || e.key === 'Left' || e.keyCode === 37 || e.keyCode === 21;
      const isRight = e.key === 'ArrowRight' || e.key === 'Right' || e.keyCode === 39 || e.keyCode === 22;
      const isEnter = e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 66 || e.keyCode === 23;
      const isEscape = e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27 || e.keyCode === 4; // 4 is Android Back button

      if (isUp || isDown || isLeft || isRight) {
        e.preventDefault();

        if (!currentFocused) {
          // No element focused yet → focus first
          elements[0]?.focus();
          currentIndexRef.current = 0;
          return;
        }

        let direction: 'up' | 'down' | 'left' | 'right' = 'up';
        if (isDown) direction = 'down';
        if (isLeft) direction = 'left';
        if (isRight) direction = 'right';

        const next = findNearest(currentFocused, direction, elements);
        if (next) {
          next.focus();
          currentIndexRef.current = elements.indexOf(next);
          // Scroll into view if needed (for scrollable containers)
          next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      } else if (isEnter) {
        if (currentFocused) {
          e.preventDefault();
          currentFocused.click();
        }
      } else if (isEscape) {
        e.preventDefault();
        onEscape?.();
      }
    },
    [enabled, getFocusableElements, findNearest, onEscape]
  );

  // Keyboard handler
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

    // We rely exclusively on D-pad keystrokes for focus traversal.
    // Mouse movement is ignored to prevent "pixel-by-pixel" dragging issues 
    // when STB remotes are accidentally placed in "mouse emulation" mode.
  // Aggressively capture initial state to disable TV virtual cursor mode
  useEffect(() => {
    if (!enabled) return;
    
    const tryFocus = () => {
      const elements = getFocusableElements();
      const hasActiveFocus = document.activeElement && document.activeElement.matches(selector);
      
      if (elements.length > 0 && !hasActiveFocus) {
        elements[0].focus();
        currentIndexRef.current = 0;
      }
    };

    tryFocus(); // Attempt immediately
    const t1 = setTimeout(tryFocus, 100);
    const t2 = setTimeout(tryFocus, 350);
    const t3 = setTimeout(tryFocus, 800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [enabled, getFocusableElements, selector]);
}
