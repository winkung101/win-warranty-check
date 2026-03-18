import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Customer = Tables<"customers">;

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCustomer(customer: {
  name: string;
  phone: string;
  device_model: string;
  imei: string;
  warranty_start: string;
  warranty_end: string;
  notes?: string;
}): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function findCustomerByImei(imei: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("imei", imei)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function getWarrantyStatus(customer: Customer): {
  status: "active" | "expired";
  daysLeft: number;
} {
  const now = new Date();
  const end = new Date(customer.warranty_end);
  const diffMs = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    status: daysLeft > 0 ? "active" : "expired",
    daysLeft: Math.max(0, daysLeft),
  };
}

// Admin auth using Supabase Auth
export async function adminLogin(email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut();
}

// IMEI memory
const IMEI_KEY = "win_saved_imei";

export function getSavedImei(): string | null {
  return localStorage.getItem(IMEI_KEY);
}

export function saveImei(imei: string): void {
  localStorage.setItem(IMEI_KEY, imei);
}

export function clearSavedImei(): void {
  localStorage.removeItem(IMEI_KEY);
}
