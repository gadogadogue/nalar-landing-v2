// src/app/admin/invoice/InvoiceAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/layout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { ItemDescriptionEditor } from "./ItemDescriptionEditor";
import {
  createEmptyItem,
  formatCurrency,
  invoiceSubtotal,
  invoiceTotal,
  todayISO,
  addDaysISO,
  type Invoice,
  type InvoiceItem,
  type PartyInfo,
  type PaymentInfo,
  type ClientTemplate,
} from "../../data/invoice";
import {
  loadCompany,
  saveCompany,
  loadClients,
  upsertClient,
  loadPaymentTemplates,
  savePaymentTemplate,
  loadItemTemplates,
  saveItemTemplates,
  deleteItemTemplate,
  nextInvoiceNumber,
} from "../../lib/invoice-storage";
import { InvoiceDocument } from "./InvoiceDocument";
import "./invoice-print.css";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const EMPTY_PARTY: PartyInfo = { name: "", address: "", email: "", phone: "" };
const EMPTY_PAYMENT: PaymentInfo = { details: "", terms: "" };

export function InvoiceAdminPage() {
  const [company, setCompany] = useState<PartyInfo>(EMPTY_PARTY);
  const [client, setClient] = useState<PartyInfo>(EMPTY_PARTY);
  const [payment, setPayment] = useState<PaymentInfo>(EMPTY_PAYMENT);
  const [items, setItems] = useState<InvoiceItem[]>([createEmptyItem()]);
  const [number, setNumber] = useState("");
  const [numberMode, setNumberMode] = useState<"auto" | "custom">("auto");
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(() => addDaysISO(todayISO(), 14));
  const [savedClients, setSavedClients] = useState<ClientTemplate[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [itemTemplates, setItemTemplates] = useState<InvoiceItem[]>([]);

  // One-time init from localStorage + reserve the first invoice number.
  useEffect(() => {
    setCompany(loadCompany());
    setSavedClients(loadClients());
    setNumber(nextInvoiceNumber());
  }, []);

  const invoice: Invoice = useMemo(
    () => ({ number, date, dueDate, company, client, items, payment }),
    [number, date, dueDate, company, client, items, payment],
  );

  const subtotal = invoiceSubtotal(items);
  const total = invoiceTotal(items);

  function updateItem(id: string, patch: Partial<InvoiceItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function handleSaveCompanyTemplate() {
    saveCompany(company);
  }

  function handleSelectClient(id: string) {
    setSelectedClientId(id);
    if (!id) {
      setClient(EMPTY_PARTY);
      setPayment(EMPTY_PAYMENT);
      setItemTemplates([]);
      return;
    }
    const found = savedClients.find((c) => c.id === id);
    if (found) {
      setClient(found);
      const templates = loadPaymentTemplates();
      setPayment(templates[id] ?? EMPTY_PAYMENT);
    }

    const savedItems = loadItemTemplates(id);
    setItemTemplates(savedItems);

    // Auto-fill from the client's saved items, but only for a still-blank
    // invoice — never clobber items the user has already started typing.
    const isBlankInvoice =
      items.length === 1 && !items[0].description.trim() && items[0].qty === 1 && items[0].rate === 0;
    if (savedItems.length > 0 && isBlankInvoice) {
      setItems(savedItems.map((item) => ({ ...item, id: newId() })));
    }
  }

  function handleAddTemplateItem(template: InvoiceItem) {
    setItems((prev) => [...prev, { ...template, id: newId() }]);
  }

  function handleLoadAllTemplateItems() {
    if (itemTemplates.length === 0) return;
    setItems(itemTemplates.map((item) => ({ ...item, id: newId() })));
  }

  function handleDeleteItemTemplate(itemId: string) {
    if (!selectedClientId) return;
    deleteItemTemplate(selectedClientId, itemId);
    setItemTemplates((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handleSaveClient() {
    if (!client.name.trim()) return;
    const id = selectedClientId || newId();
    upsertClient({ id, ...client });
    savePaymentTemplate(id, payment);
    const itemsToSave = items.filter((item) => item.description.trim() !== "");
    saveItemTemplates(id, itemsToSave);
    setItemTemplates(itemsToSave);
    setSelectedClientId(id);
    setSavedClients(loadClients());
  }

  function handleNewInvoiceNumber() {
    setNumber(nextInvoiceNumber());
  }

  function handleNumberModeChange(mode: "auto" | "custom") {
    setNumberMode(mode);
    if (mode === "auto") setNumber(nextInvoiceNumber());
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] font-body text-ink">
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[420px_1fr]">
        {/* ---- Form column (hidden from print via CSS visibility rules) ---- */}
        <div
          className="space-y-6 overflow-y-auto rounded-card bg-white p-6"
          style={{ maxHeight: "calc(100vh - 48px)" }}
        >
          <div>
            <h1 className="mb-1 font-display text-2xl font-medium tracking-[-0.02em]">
              Invoice generator
            </h1>
            <p className="font-display text-sm text-muted-ink">Nalar Labs internal tool</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-ink">
              From (Nalar Labs)
            </h2>
            <Input
              placeholder="Company name"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
            <Textarea
              placeholder="Address"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Email"
              value={company.email ?? ""}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={company.phone ?? ""}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
            />
            <Button size="sm" variant="outline" onClick={handleSaveCompanyTemplate}>
              Save as template
            </Button>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-ink">
                Bill to
              </h2>
              {savedClients.length > 0 && (
                <select
                  className="rounded-md border border-line bg-input-background px-2 py-1 text-xs"
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                >
                  <option value="">New client…</option>
                  {savedClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <Input
              placeholder="Client / company name"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
            />
            <Textarea
              placeholder="Client address"
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Email"
              value={client.email ?? ""}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={client.phone ?? ""}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
            />
            <Button size="sm" variant="outline" onClick={handleSaveClient}>
              Save client
            </Button>
            <p className="text-xs text-muted-ink">
              Also saves the work items below as this client's template, so next month's invoice
              can reload them instead of retyping.
            </p>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-ink">
              Invoice details
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs text-muted-ink">Invoice #</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleNumberModeChange("auto")}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs transition-colors",
                        numberMode === "auto"
                          ? "border-ink bg-ink text-white"
                          : "border-line text-muted-ink hover:border-ink",
                      )}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumberModeChange("custom")}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs transition-colors",
                        numberMode === "custom"
                          ? "border-ink bg-ink text-white"
                          : "border-line text-muted-ink hover:border-ink",
                      )}
                    >
                      Custom
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={number}
                    readOnly={numberMode === "auto"}
                    placeholder={numberMode === "custom" ? "Type your own invoice number" : undefined}
                    onChange={(e) => numberMode === "custom" && setNumber(e.target.value)}
                  />
                  {numberMode === "auto" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNewInvoiceNumber}
                      title="Generate a new invoice number"
                    >
                      New #
                    </Button>
                  )}
                </div>
                {numberMode === "auto" && (
                  <p className="mt-1 text-xs text-muted-ink">
                    Format: year + sequence + time generated (e.g. INV-2026-0007-143045).
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1 text-xs text-muted-ink">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 text-xs text-muted-ink">Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-ink">
              Work items
            </h2>

            {selectedClientId && itemTemplates.length > 0 && (
              <div className="rounded-md border border-dashed border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-ink">
                    Saved items for this client
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={handleLoadAllTemplateItems}
                  >
                    Load all
                  </Button>
                </div>
                <ul className="space-y-1">
                  {itemTemplates.map((template) => (
                    <li key={template.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-ink" title={template.description}>
                        {template.description || "(no description)"} — {template.qty} ×{" "}
                        {formatCurrency(template.rate)}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleAddTemplateItem(template)}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive"
                          onClick={() => handleDeleteItemTemplate(template.id)}
                          title="Delete this saved item template"
                        >
                          ✕
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-md border border-line p-3">
                  <ItemDescriptionEditor
                    value={item.description}
                    onChange={(value) => updateItem(item.id, { description: value })}
                  />
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={addItem}>
              + Add item
            </Button>

            <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-ink">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-ink">
              Payment info
            </h2>
            <Textarea
              placeholder="Bank details / payment instructions"
              value={payment.details}
              onChange={(e) => setPayment({ ...payment, details: e.target.value })}
              rows={3}
            />
            <Label className="mb-1 mt-2 block text-xs text-muted-ink">
              Terms &amp; conditions
            </Label>
            <Textarea
              placeholder="Terms & conditions"
              value={payment.terms}
              onChange={(e) => setPayment({ ...payment, terms: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-ink">
              Payment info and terms save together with the client above (they travel with
              "Save client").
            </p>
          </section>

          <Button className="w-full" onClick={handlePrint}>
            Print / Save as PDF
          </Button>
        </div>

        {/* ---- Live A4 preview — this is also the print target ---- */}
        <div className="invoice-preview-scale rounded-card">
          <InvoiceDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
