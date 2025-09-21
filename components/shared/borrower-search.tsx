'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconSearch, IconUser, IconMail, IconPhone, IconPlus } from '@tabler/icons-react';
import { isPlaceholderEmail } from '@/lib/borrower-utils';

interface Borrower {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

interface BorrowerSearchProps {
  onSelectBorrower: (borrower: Borrower) => void;
  onCreateNew: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function BorrowerSearch({
  onSelectBorrower,
  onCreateNew,
  placeholder = 'Search borrowers by name or email...',
  disabled = false,
}: BorrowerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Borrower[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock search function - replace with actual API call
  const searchBorrowers = async (term: string): Promise<Borrower[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock data - replace with actual API call
    const mockBorrowers: Borrower[] = [
      {
        id: '1',
        name: 'Anna Andersson',
        email: 'anna.andersson@example.com',
        phone: '070-123 4567',
        company: '',
      },
      {
        id: '2',
        name: 'Erik Eriksson',
        email: 'erik.eriksson@placeholder.com',
        phone: '073-987 6543',
        company: 'Fastighetsskötsel AB',
      },
      {
        id: '3',
        name: 'Maria Nilsson',
        email: 'maria.nilsson@email.com',
        phone: '',
        company: '',
      },
    ];

    return mockBorrowers.filter(
      (borrower) =>
        borrower.name.toLowerCase().includes(term.toLowerCase()) ||
        borrower.email.toLowerCase().includes(term.toLowerCase()),
    );
  };

  // Debounced search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchBorrowers(searchTerm);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectBorrower = (borrower: Borrower) => {
    setSearchTerm('');
    setShowResults(false);
    onSelectBorrower(borrower);
  };

  const handleCreateNew = () => {
    setSearchTerm('');
    setShowResults(false);
    onCreateNew();
  };

  return (
    <div className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
            disabled={disabled}
          />
        </div>
        <Button onClick={handleCreateNew} variant="outline" className="gap-1" disabled={disabled}>
          <IconPlus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-muted-foreground">Searching...</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((borrower) => (
                  <Button
                    key={borrower.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleSelectBorrower(borrower)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <IconUser className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{borrower.name}</span>
                          {isPlaceholderEmail(borrower.email) && (
                            <Badge variant="outline" className="text-xs">
                              Placeholder
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <IconMail className="h-3 w-3" />
                            <span
                              className={isPlaceholderEmail(borrower.email) ? 'text-amber-600' : ''}
                            >
                              {borrower.email}
                            </span>
                          </div>
                          {borrower.phone && (
                            <div className="flex items-center gap-1">
                              <IconPhone className="h-3 w-3" />
                              <span>{borrower.phone}</span>
                            </div>
                          )}
                        </div>
                        {borrower.company && (
                          <div className="text-sm text-muted-foreground">
                            Affiliation: {borrower.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <IconUser className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No borrowers found for "{searchTerm}"
                </p>
                <Button onClick={handleCreateNew} variant="outline" size="sm" className="gap-1">
                  <IconPlus className="h-3.5 w-3.5" />
                  Create New Borrower
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BorrowerSearch;
