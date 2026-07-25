// src/app/lib/invoice-storage.ts
// Browser-only localStorage persistence for the invoice admin page: the
// Nalar Labs company template, saved clients, per-client payment/terms
// templates, and the auto-incrementing invoice counter. Kept apart from
// invoice.ts so the pure domain logic stays testable under node --test
// (localStorage doesn't exist there).
import type { ClientTemplate, InvoiceItem, PartyInfo, PaymentInfo } from "../data/invoice";
import { formatAutoInvoiceNumber } from "../data/invoice";

const KEYS = {
  company: "nalar_invoice_company_v1",
  clients: "nalar_invoice_clients_v1",
  payment: "nalar_invoice_payment_v1",
  itemTemplates: "nalar_invoice_item_templates_v1",
  counter: "nalar_invoice_counter_v1",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail (private browsing, quota) — the form still works
    // in-memory for the current session even if persistence fails.
  }
}

export const DEFAULT_COMPANY: PartyInfo = {
  name: "Nalar Labs",
  address: "",
  email: "",
  phone: "",
};

export function loadCompany(): PartyInfo {
  return read(KEYS.company, DEFAULT_COMPANY);
}

export function saveCompany(info: PartyInfo): void {
  write(KEYS.company, info);
}

export function loadClients(): ClientTemplate[] {
  return read<ClientTemplate[]>(KEYS.clients, []);
}

/** Adds a new saved client or updates an existing one by id. */
export function upsertClient(client: ClientTemplate): void {
  const clients = loadClients();
  const index = clients.findIndex((c) => c.id === client.id);
  if (index >= 0) clients[index] = client;
  else clients.push(client);
  write(KEYS.clients, clients);
}

export function deleteClient(id: string): void {
  write(
    KEYS.clients,
    loadClients().filter((c) => c.id !== id),
  );
}

/** Keyed by client id — one payment/terms template per saved client. */
export function loadPaymentTemplates(): Record<string, PaymentInfo> {
  return read(KEYS.payment, {} as Record<string, PaymentInfo>);
}

export function savePaymentTemplate(clientId: string, info: PaymentInfo): void {
  const all = loadPaymentTemplates();
  all[clientId] = info;
  write(KEYS.payment, all);
}

/**
 * Keyed by client id — each client's saved, recurring work items, so a
 * monthly invoice doesn't need to be retyped from scratch.
 */
export function loadItemTemplates(clientId: string): InvoiceItem[] {
  const all = read<Record<string, InvoiceItem[]>>(KEYS.itemTemplates, {});
  return all[clientId] ?? [];
}

/** Overwrites the full saved item list for a client (used by "Save client"). */
export function saveItemTemplates(clientId: string, items: InvoiceItem[]): void {
  const all = read<Record<string, InvoiceItem[]>>(KEYS.itemTemplates, {});
  all[clientId] = items;
  write(KEYS.itemTemplates, all);
}

/** Removes a single saved item template — e.g. one saved by mistake. */
export function deleteItemTemplate(clientId: string, itemId: string): void {
  saveItemTemplates(
    clientId,
    loadItemTemplates(clientId).filter((item) => item.id !== itemId),
  );
}

/**
 * Reserves and returns the next auto-generated invoice number (year +
 * sequence + generation time), persisting the counter. Used only in "Auto"
 * mode — "Custom" mode lets the user type any number instead.
 */
export function nextInvoiceNumber(): string {
  const seq = read(KEYS.counter, 0) + 1;
  write(KEYS.counter, seq);
  return formatAutoInvoiceNumber(seq);
}
