'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconDotsVertical,
  IconMail,
  IconPhone,
  IconEdit,
  IconPlus,
  IconArrowBackUp,
  IconKeyOff,
  IconReplace,
} from '@tabler/icons-react';
import type { BorrowerWithKeys } from './borrower-columns';

export type DialogType = 'return-keys' | 'lost-key' | 'replace-key';

interface BorrowerActionsMenuProps {
  borrower: BorrowerWithKeys;
  onOpenDialog: (type: DialogType) => void;
}

export function BorrowerActionsMenu({ borrower, onOpenDialog }: BorrowerActionsMenuProps) {
  const hasActiveKeys = borrower.borrowedKeys.length > 0;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu for {borrower.borrowerName}</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
          {borrower.email && (
            <DropdownMenuItem onClick={() => (window.location.href = `mailto:${borrower.email}`)}>
              <IconMail className="h-3.5 w-3.5 mr-2" />
              Email
            </DropdownMenuItem>
          )}
          {borrower.phone && (
            <DropdownMenuItem onClick={() => (window.location.href = `tel:${borrower.phone}`)}>
              <IconPhone className="h-3.5 w-3.5 mr-2" />
              Call
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Borrower Management</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <IconEdit className="h-3.5 w-3.5 mr-2" />
            Edit Contact
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <IconPlus className="h-3.5 w-3.5 mr-2" />
            Issue Key
          </DropdownMenuItem>
          {hasActiveKeys && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Loan Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onOpenDialog('return-keys')}>
                <IconArrowBackUp className="h-3.5 w-3.5 mr-2" />
                Return Keys
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenDialog('lost-key')}>
                <IconKeyOff className="h-3.5 w-3.5 mr-2" />
                Mark Key Lost
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenDialog('replace-key')}>
                <IconReplace className="h-3.5 w-3.5 mr-2" />
                Replace Key
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

