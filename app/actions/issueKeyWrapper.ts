'use server';

import { issueKey, returnKey, markKeyLost } from './issueKey';
import { addKeyCopy } from './keyTypes';

export async function issueKeyAction(data: {
  keyTypeId: string;
  keyCopyId?: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone?: string;
  borrowerCompany?: string;
  borrowerAddress?: string;
  borrowerPurpose?: string;
  dueDate?: string;
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

export async function issueMultipleKeysAction(
  data: {
    keyTypeIds: string[];
    borrowerName: string;
    borrowerEmail: string;
    borrowerPhone?: string;
    borrowerCompany?: string;
    borrowerAddress?: string;
    borrowerPurpose?: string;
    dueDate?: string;
    idChecked: boolean;
    borrowerId?: string; // Optional: if provided, use existing borrower instead of creating
  },
  options?: { keyCopyIdsByType?: Record<string, string> },
) {
  try {
    // Issue keys one by one
    const results = await Promise.all(
      data.keyTypeIds.map((keyTypeId) =>
        issueKeyAction({
          keyTypeId,
          keyCopyId: options?.keyCopyIdsByType?.[keyTypeId],
          borrowerName: data.borrowerName,
          borrowerEmail: data.borrowerEmail,
          borrowerPhone: data.borrowerPhone,
          borrowerCompany: data.borrowerCompany,
          borrowerAddress: data.borrowerAddress,
          borrowerPurpose: data.borrowerPurpose,
          dueDate: data.dueDate,
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

export async function returnKeyAction(issueRecordId: string) {
  const result = await returnKey(issueRecordId);
  return {
    success: result.success,
    error: result.success ? undefined : result.error,
  };
}

export async function returnMultipleKeysAction(issueRecordIds: string[]) {
  try {
    const results = await Promise.all(issueRecordIds.map((id) => returnKeyAction(id)));
    const allSuccessful = results.every((r) => r.success);
    if (allSuccessful) return { success: true };
    const errors = results
      .filter((r) => !r.success)
      .map((r) => r.error)
      .filter(Boolean)
      .join(', ');
    return { success: false, error: errors || 'Failed to return one or more keys' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to return keys',
    };
  }
}

export async function markKeyLostAction(params: {
  issueRecordId: string;
  createReplacement?: boolean;
  issueReplacement?: boolean;
  idChecked?: boolean;
  dueDate?: string;
}) {
  const result = await markKeyLost(params);
  return {
    success: result.success,
    replacementCopyId: result.success ? result.data?.replacementCopyId : undefined,
    error: result.success ? undefined : result.error,
  };
}
