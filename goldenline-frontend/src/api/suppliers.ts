import { bridge } from './bridge';

export type Supplier = {
  supplierId: number;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
};

export type SupplierRequest = {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export const fetchSuppliers = async (includeInactive = false) => {
  return bridge.getSuppliers(includeInactive);
};

export const createSupplier = async (payload: SupplierRequest) => {
  return bridge.createSupplier(payload as unknown as Record<string, unknown>);
};

export const updateSupplier = async (supplierId: number, payload: SupplierRequest) => {
  await bridge.updateSupplier(supplierId, payload as unknown as Record<string, unknown>);
};

export const deleteSupplier = async (supplierId: number) => {
  await bridge.deleteSupplier(supplierId);
};
