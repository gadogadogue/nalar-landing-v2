// src/app/data/invoice.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lineAmount,
  invoiceSubtotal,
  invoiceTotal,
  paginateInvoiceItems,
  formatInvoiceNumber,
  formatAutoInvoiceNumber,
  addDaysISO,
} from "./invoice.ts";

test("lineAmount multiplies qty by rate", () => {
  assert.equal(lineAmount({ qty: 3, rate: 50 }), 150);
});

test("lineAmount treats non-finite qty/rate as 0 (empty form fields)", () => {
  assert.equal(lineAmount({ qty: NaN, rate: 50 }), 0);
  assert.equal(lineAmount({ qty: 2, rate: NaN }), 0);
});

test("invoiceSubtotal sums all line amounts", () => {
  const items = [
    { id: "1", description: "A", qty: 2, rate: 100 },
    { id: "2", description: "B", qty: 1, rate: 50 },
  ];
  assert.equal(invoiceSubtotal(items), 250);
});

test("invoiceTotal currently mirrors subtotal (no tax modeled yet)", () => {
  const items = [{ id: "1", description: "A", qty: 1, rate: 10 }];
  assert.equal(invoiceTotal(items), invoiceSubtotal(items));
});

test("paginateInvoiceItems keeps everything on one page under the first-page limit", () => {
  const items = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    description: "x",
    qty: 1,
    rate: 1,
  }));
  const pages = paginateInvoiceItems(items);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].length, 5);
});

test("paginateInvoiceItems splits overflow onto continuation pages", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    description: "x",
    qty: 1,
    rate: 1,
  }));
  const pages = paginateInvoiceItems(items);
  assert.ok(pages.length >= 2);
  const total = pages.reduce((n, p) => n + p.length, 0);
  assert.equal(total, 30);
});

test("paginateInvoiceItems returns a single empty page for zero items", () => {
  const pages = paginateInvoiceItems([]);
  assert.deepEqual(pages, [[]]);
});

test("formatInvoiceNumber pads the sequence to 4 digits and includes the year", () => {
  const date = new Date("2026-07-24");
  assert.equal(formatInvoiceNumber(7, date), "INV-2026-0007");
  assert.equal(formatInvoiceNumber(1234, date), "INV-2026-1234");
});

test("addDaysISO adds calendar days", () => {
  assert.equal(addDaysISO("2026-01-01", 14), "2026-01-15");
});

test("formatAutoInvoiceNumber appends zero-padded HHmmss to the year+sequence", () => {
  const date = new Date("2026-07-24T09:05:03");
  assert.equal(formatAutoInvoiceNumber(7, date), "INV-2026-0007-090503");
});
