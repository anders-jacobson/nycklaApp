'use server';

import { issueKey } from './issueKey';
import { addKeyCopy } from './keyTypes';

export async function issueKeyAction(data: {
  keyTypeId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone?: string;
  borrowerCompany?: string;
  dueDate?: string;
  notes?: string;
  idChecked: boolean;
  borrowerId?: string; // Optional: if provided, use existing borrower instead of creating
}) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });

  const result = await issueKey(formData);
  return {
    success: result.success,
    error: result.success ? undefined : result.error,
  };
}

export async function createKeyCopyAction(keyTypeId: string) {
  const formData = new FormData();
  formData.append('id', keyTypeId);
  return await addKeyCopy(formData);
}

export async function issueMultipleKeysAction(data: {
  keyTypeIds: string[];
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone?: string;
  borrowerCompany?: string;
  dueDate?: string;
  notes?: string;
  idChecked: boolean;
  borrowerId?: string; // Optional: if provided, use existing borrower instead of creating
}) {
  try {
    // Issue keys one by one
    const results = await Promise.all(
      data.keyTypeIds.map((keyTypeId) =>
        issueKeyAction({
          keyTypeId,
          borrowerName: data.borrowerName,
          borrowerEmail: data.borrowerEmail,
          borrowerPhone: data.borrowerPhone,
          borrowerCompany: data.borrowerCompany,
          dueDate: data.dueDate,
          notes: data.notes,
          idChecked: data.idChecked,
          borrowerId: data.borrowerId,
        }),
      ),
    );

    // Check if all were successful
    const allSuccessful = results.every((result) => result.success);
    if (allSuccessful) {
      return { success: true };
    } else {
      const errors = results
        .filter((r) => !r.success)
        .map((r) => r.error)
        .join(', ');
      return { success: false, error: errors };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to issue keys',
    };
  }
}
