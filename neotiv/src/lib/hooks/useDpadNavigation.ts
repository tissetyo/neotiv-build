'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * D-pad spatial navigation hook for TV dashboard.
 * Manages keyboard-based focus traversal using ArrowUp/Down/Left/Right,
 * Enter for activation, and Escape for closing modals.
 */
export function useDpadNavigation(options?: {
  enabled?: boolean;
  onEscape?: () => void;
  selector?: string;
}) {
  const { enabled = true, onEscape, selector = '.tv-focusable' } = options || {};
  const currentIndexRef = useRef<number>(-1);

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      const currentFocused = elements.includes(activeElement) ? activeElement : null;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault();

          if (!currentFocused) {
            // No element focused yet → focus first
            elements[0]?.focus();
            currentIndexRef.current = 0;
            return;
          }

          const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
          };

          const next = findNearest(currentFocused, directionMap[e.key], elements);
          if (next) {
            next.focus();
            currentIndexRef.current = elements.indexOf(next);
            // Scroll into view if needed (for scrollable containers)
            next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
          break;
        }

        case 'Enter': {
          if (currentFocused) {
            e.preventDefault();
            currentFocused.click();
          }
          break;
        }

        case 'Escape': {
          e.preventDefault();
          onEscape?.();
          break;
        }
      }
    },
    [enabled, getFocusableElements, findNearest, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Auto-focus first element on mount
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      const elements = getFocusableElements();
      if (elements.length > 0 && !document.activeElement?.classList.contains('tv-focusable')) {
        elements[0].focus();
        currentIndexRef.current = 0;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [enabled, getFocusableElements]);
}
