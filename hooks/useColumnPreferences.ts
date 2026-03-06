'use client';

import { useState, useEffect } from 'react';
import {
  ColumnVisibility,
  defaultColumnVisibility,
  mobileColumnVisibility,
} from '@/components/active-loans/borrower-columns';
import { useIsMobile } from './use-mobile';

const COLUMN_PREFERENCES_KEY = 'borrower-table-column-preferences';

export function useColumnPreferences() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // Always start with default visibility to prevent hydration mismatch
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibility>(defaultColumnVisibility);

  // Initialize preferences after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);

    const getInitialVisibility = (): ColumnVisibility => {
      // Try to load from localStorage first
      try {
        const saved = localStorage.getItem(COLUMN_PREFERENCES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ColumnVisibility;
          // Validate that all required keys exist
          const hasAllKeys = Object.keys(defaultColumnVisibility).every((key) => key in parsed);
          if (hasAllKeys) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load column preferences from localStorage:', error);
      }

      // Return appropriate default based on screen size
      return isMobile ? mobileColumnVisibility : defaultColumnVisibility;
    };

    setColumnVisibility(getInitialVisibility());
  }, [isMobile]);

  // Save to localStorage whenever preferences change (only after mount)
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(COLUMN_PREFERENCES_KEY, JSON.stringify(columnVisibility));
      } catch (error) {
        console.warn('Failed to save column preferences to localStorage:', error);
      }
    }
  }, [columnVisibility, mounted]);

  // Automatically adjust for mobile when screen size changes (only after mount)
  useEffect(() => {
    if (mounted && isMobile) {
      // On mobile, prioritize essential columns
      setColumnVisibility((prev) => ({
        ...prev,
        affiliation: false, // Hide on mobile to save space
        dateIssued: false,
        returnDate: false,
      }));
    }
  }, [isMobile, mounted]);

  const resetToDefaults = () => {
    const defaults = isMobile ? mobileColumnVisibility : defaultColumnVisibility;
    setColumnVisibility(defaults);
  };

  const showAllColumns = () => {
    const allVisible = Object.keys(defaultColumnVisibility).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as ColumnVisibility,
    );
    setColumnVisibility(allVisible);
  };

  const hideAllOptionalColumns = () => {
    setColumnVisibility({
      affiliation: isMobile ? false : true,
      dateIssued: false,
      returnDate: false,
    });
  };

  return {
    columnVisibility,
    setColumnVisibility,
    resetToDefaults,
    showAllColumns,
    hideAllOptionalColumns,
    isMobile,
  };
}
