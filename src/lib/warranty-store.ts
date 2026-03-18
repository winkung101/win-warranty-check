import { Customer } from "@/types/warranty";

const STORAGE_KEY = "win_warranty_customers";

export function getCustomers(): Customer[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

export function addCustomer(customer: Omit<Customer, "id">): Customer {
  const customers = getCustomers();
  const newCustomer: Customer = {
    ...customer,
    id: crypto.randomUUID(),
  };
  customers.push(newCustomer);
  saveCustomers(customers);
  return newCustomer;
}

export function updateCustomer(id: string, data: Partial<Customer>): Customer | null {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) return null;
  customers[index] = { ...customers[index], ...data };
  saveCustomers(customers);
  return customers[index];
}

export function deleteCustomer(id: string): boolean {
  const customers = getCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  if (filtered.length === customers.length) return false;
  saveCustomers(filtered);
  return true;
}

export function findCustomerByImei(imei: string): Customer | undefined {
  return getCustomers().find((c) => c.imei === imei);
}

export function getWarrantyStatus(customer: Customer): {
  status: "active" | "expired";
  daysLeft: number;
} {
  const now = new Date();
  const end = new Date(customer.warrantyEnd);
  const diffMs = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    status: daysLeft > 0 ? "active" : "expired",
    daysLeft: Math.max(0, daysLeft),
  };
}

// Admin auth
const ADMIN_KEY = "win_admin_auth";

export function adminLogin(username: string, password: string): boolean {
  if (username === "admin" && password === "win2024") {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_KEY);
}
