// src/app/data/invoice.ts
// Pure invoice domain logic — no DOM, no localStorage — so it's testable
// under `node --test` like the rest of this repo's data modules. Browser
// persistence lives in src/app/lib/invoice-storage.ts.

export type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

export type PartyInfo = {
  name: string;
  /** Free-form multiline address / contact block. */
  address: string;
  email?: string;
  phone?: string;
};

export type ClientTemplate = PartyInfo & { id: string };

export type PaymentInfo = {
  /** Bank details / payment instructions, multiline. */
  details: string;
  /** Terms & conditions, multiline. */
  terms: string;
};

export type Invoice = {
  number: string;
  date: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  company: PartyInfo;
  client: PartyInfo;
  items: InvoiceItem[];
  payment: PaymentInfo;
};

export function lineAmount(item: Pick<InvoiceItem, "qty" | "rate">): number {
  const qty = Number.isFinite(item.qty) ? item.qty : 0;
  const rate = Number.isFinite(item.rate) ? item.rate : 0;
  return qty * rate;
}

export function invoiceSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + lineAmount(item), 0);
}

/**
 * No tax/discount modeled yet — total mirrors subtotal but is kept as a
 * distinct function so a discount/tax line can be inserted later without
 * moving call sites in the form/document components.
 */
export function invoiceTotal(items: InvoiceItem[]): number {
  return invoiceSubtotal(items);
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

const FIRST_PAGE_ROWS = 12;
const OTHER_PAGE_ROWS = 20;

/**
 * Splits invoice line items across A4 pages. The first page also carries
 * the header (logo, addresses, invoice meta), so it holds fewer rows;
 * continuation pages are line-items only, so they hold more. Totals,
 * payment info, and terms are rendered by the caller on the final page.
 */
export function paginateInvoiceItems(items: InvoiceItem[]): InvoiceItem[][] {
  if (items.length === 0) return [[]];
  if (items.length <= FIRST_PAGE_ROWS) return [items];

  const pages: InvoiceItem[][] = [items.slice(0, FIRST_PAGE_ROWS)];
  let rest = items.slice(FIRST_PAGE_ROWS);
  while (rest.length > 0) {
    pages.push(rest.slice(0, OTHER_PAGE_ROWS));
    rest = rest.slice(OTHER_PAGE_ROWS);
  }
  return pages;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/** Formats an auto-incrementing invoice number as INV-{year}-{seq}. */
export function formatInvoiceNumber(seq: number, date: Date = new Date()): string {
  return `INV-${date.getFullYear()}-${pad(seq, 4)}`;
}

/**
 * "Auto" mode's invoice-number format: year + sequence + the time it was
 * generated, e.g. INV-2026-0007-143045. This is one of the two number
 * modes surfaced in the admin UI (the other is a fully custom, hand-typed
 * number) — see InvoiceAdminPage's Auto/Custom toggle.
 */
export function formatAutoInvoiceNumber(seq: number, date: Date = new Date()): string {
  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  return `INV-${date.getFullYear()}-${pad(seq, 4)}-${hh}${mm}${ss}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createEmptyItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: "", qty: 1, rate: 0 };
}
