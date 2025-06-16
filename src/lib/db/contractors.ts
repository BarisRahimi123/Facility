export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  specialties: string[];
  rating: number;
  completedJobs: number;
  responseTime: string;
  availability: 'Available' | 'Busy' | 'Unavailable';
  lastHired: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getContractors() {
  const response = await fetch('/api/contractors');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contractors');
  }
  return response.json();
}

export async function getContractor(id: string) {
  const response = await fetch(`/api/contractors/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contractor');
  }
  return response.json();
}

export async function createContractor(contractor: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/contractors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contractor),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create contractor');
  }
  return response.json();
}

export async function updateContractor(id: string, updates: Partial<Contractor>) {
  const response = await fetch(`/api/contractors/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update contractor');
  }
  return response.json();
}

export async function deleteContractor(id: string) {
  const response = await fetch(`/api/contractors/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete contractor');
  }
} 