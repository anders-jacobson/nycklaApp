'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrganisation } from '@/app/actions/organisation';
import { IconBuilding } from '@tabler/icons-react';

interface CreateOrganisationDialogProps {
  children: React.ReactNode;
}

export function CreateOrganisationDialog({ children }: CreateOrganisationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createOrganisation(name);
      
      if (result.success) {
        setOpen(false);
        setName('');
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Error creating organisation:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBuilding className="h-5 w-5" />
              Create New Organisation
            </DialogTitle>
            <DialogDescription>
              Create a new organisation to manage keys, borrowers, and team members. You will be the owner of this organisation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organisation-name">Organisation Name</Label>
              <Input
                id="organisation-name"
                placeholder="e.g., Brf Solrosen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                This will be the name of your housing cooperative or organisation.
              </p>
            </div>
            
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Organisation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








