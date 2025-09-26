'use client';

import { useState, useRef, useEffect } from 'react';
import { IconBulb } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface KeyboardTipProps {
  message: string;
  shortcuts?: Array<{
    key: string;
    action: string;
  }>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
}

export function KeyboardTip({
  message,
  shortcuts = [],
  position = 'top',
  className,
  iconClassName,
}: KeyboardTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse events (desktop)
  const handleMouseEnter = () => {
    if (!isTouched) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouched) {
      timeoutRef.current = setTimeout(() => setIsVisible(false), 100);
    }
  };

  // Handle touch events (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsTouched(true);
    setIsVisible(!isVisible);
  };

  // Hide on outside click/touch for mobile
  useEffect(() => {
    const handleClickOutside = () => {
      if (isTouched) {
        setIsVisible(false);
        setIsTouched(false);
      }
    };

    if (isTouched) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isTouched]);

  const tooltipPositionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom:
      'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right:
      'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {/* Trigger Icon */}
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-help',
          'touch-manipulation', // Better touch targets on mobile
          iconClassName,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        aria-label="Show keyboard shortcuts"
        aria-expanded={isVisible}
      >
        <IconBulb className="h-4 w-4" />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-xs text-white bg-gray-800 rounded-md shadow-lg',
            'whitespace-nowrap max-w-xs sm:max-w-sm',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            tooltipPositionClasses[position],
          )}
          role="tooltip"
        >
          {/* Arrow */}
          <div className={cn('absolute w-0 h-0 border-4', arrowClasses[position])} />

          {/* Content */}
          <div className="space-y-1">
            {message && <div className="text-gray-200">{message}</div>}
            {shortcuts.length > 0 && (
              <div className="space-y-1">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-700 text-gray-200 rounded border border-gray-600">
                      {shortcut.key}
                    </kbd>
                    <span className="text-gray-300">{shortcut.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience component for common keyboard shortcuts
export function KeyboardShortcutTip({
  shortcuts,
  position = 'top',
  className,
}: {
  shortcuts: Array<{ key: string; action: string }>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return <KeyboardTip message="" shortcuts={shortcuts} position={position} className={className} />;
}
