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

  // Initialize with default based on screen size
  const getInitialVisibility = (): ColumnVisibility => {
    if (typeof window === 'undefined') {
      return defaultColumnVisibility;
    }

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

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(getInitialVisibility);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COLUMN_PREFERENCES_KEY, JSON.stringify(columnVisibility));
      } catch (error) {
        console.warn('Failed to save column preferences to localStorage:', error);
      }
    }
  }, [columnVisibility]);

  // Automatically adjust for mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      // On mobile, prioritize essential columns
      setColumnVisibility((prev) => ({
        ...prev,
        affiliation: false, // Hide on mobile to save space
        notes: false,
        dateIssued: false,
        returnDate: false,
      }));
    }
  }, [isMobile]);

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
      notes: false,
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
