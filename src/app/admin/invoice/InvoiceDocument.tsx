// src/app/admin/invoice/InvoiceDocument.tsx
import ReactMarkdown from "react-markdown";
import {
  formatCurrency,
  invoiceSubtotal,
  invoiceTotal,
  lineAmount,
  paginateInvoiceItems,
  type Invoice,
} from "../../data/invoice";

/**
 * Renders a work-item description's markdown (bold/italic/links only —
 * same restriction rationale as PortfolioModal, but scoped tighter since
 * this is a single line item, not a full article). Links open in a new
 * tab since they typically point at a third-party reference invoice.
 */
function ItemDescription({ text }: { text: string }) {
  if (!text.trim()) return <>—</>;
  return (
    <ReactMarkdown
      allowedElements={["p", "strong", "em", "a", "br"]}
      unwrapDisallowed
      components={{
        a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

/**
 * Self-contained Nalar mark, traced from public/favicon.svg. Embedding the
 * path directly (rather than importing the logo asset used elsewhere, e.g.
 * Navbar.tsx's `../../imports/logo/FA_Nalar Logo_dark.svg`) means the
 * invoice has no external image dependency and always renders identically
 * in print/PDF. Swap this for the full wordmark logo if you'd rather match
 * the navbar exactly — that file wasn't available to reference here.
 */
function NalarMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1393 1406"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M191.311 305.454C190.761 231.464 244.101 170.494 317.901 162.734C361.361 158.504 399.601 176.424 440.421 187.784C473.361 197.144 501.801 205.824 522.841 171.504C552.501 123.304 560.731 67.4544 607.961 30.7244C672.661 -18.5856 760.231 -6.75554 810.381 56.8045C834.401 89.2245 845.581 129.064 865.241 164.064C885.681 203.004 911.061 199.954 948.981 188.714C983.231 179.424 1019.92 163.404 1055.47 162.134C1144.33 159.754 1210.81 234.704 1199.84 322.614C1184.36 424.744 1075.03 482.194 983.311 430.824C921.401 399.504 917.101 343.934 886.161 289.984C872.111 265.404 853.381 255.914 825.511 265.284C793.281 275.624 742.961 308.884 745.851 347.444C750.451 378.084 782.271 408.474 800.611 432.574C831.221 468.464 839.131 505.844 833.641 552.334C818.121 654.714 704.111 705.874 617.581 647.604C547.981 597.034 536.261 498.334 591.871 432.574C609.761 408.584 654.201 366.594 645.771 334.304C636.801 298.604 584.301 264.434 549.251 261.984C521.551 259.414 506.091 287.334 496.281 308.974C473.391 359.114 461.541 405.204 407.861 431.524C310.131 485.154 194.491 415.304 191.311 305.454ZM0.27097 629.454C5.00097 515.794 130.681 455.034 225.301 515.954C274.001 548.574 295.721 600.694 289.801 658.594C284.611 717.214 236.761 749.354 213.211 798.854C201.731 821.864 209.011 840.675 227.391 856.745C252.221 878.725 305.191 904.514 336.281 884.094C364.211 862.184 373.431 813.355 388.351 781.995C420.751 706.685 517.561 671.644 590.111 712.184C678.291 762.094 686.321 882.004 606.531 944.234C568.861 971.894 531.911 983.054 485.271 973.854C456.541 970.074 414.941 958.414 387.501 969.164C347.891 986.854 344.331 1067.24 363.311 1100.04C376.201 1122.55 405.241 1119.73 427.361 1118.97C480.061 1114.38 524.821 1100.91 573.481 1130.85C665.581 1181.66 675.211 1306.68 594.511 1373.16C521.591 1430.56 416.531 1407.49 377.411 1322.76C360.711 1284.71 357.701 1242.7 344.771 1203.46C332.971 1165.72 310.881 1163.47 275.121 1164.93C237.061 1166.82 194.801 1176.73 157.271 1168.82C71.101 1151.08 21.071 1062.58 50.761 979.474C67.171 934.704 103.621 902.784 124.271 861.064C142.121 827.784 116.771 804.935 94.631 783.625C45.451 738.155 -0.87903 703.694 0.27097 629.454ZM730.861 835.454C730.311 726.814 845.001 660.424 939.701 713.524C994.501 742.784 1004.07 781.434 1024.93 835.354C1033.91 858.524 1047.33 887.544 1075 891.064C1112.38 894.074 1161.3 869.704 1180.82 837.444C1192.82 815.444 1175.37 789.834 1163.37 771.784C1126.51 721.214 1094.62 689.644 1102.71 621.334C1115.17 514.354 1232.63 458.134 1324.72 513.474C1393.57 556.414 1412.98 644.694 1367.76 712.504C1341.87 748.934 1303.57 773.644 1274.94 807.574C1251.48 834.654 1265.18 861.004 1282.99 886.144C1323.06 942.064 1364.74 988.904 1345.93 1063.66C1328.64 1129.91 1270.21 1172.85 1202 1171.92C1165.84 1171.32 1130.07 1163.37 1093.93 1164.8C1057.37 1166.65 1049.01 1193.73 1041.72 1224.44C1027.32 1285.36 1022.86 1338.29 969.121 1378.79C867.081 1449.67 734.851 1367.87 743.601 1246.2C748.611 1188.85 784.571 1143.88 837.061 1121.91C878.241 1102.83 923.891 1116.25 966.981 1119.12C994.481 1120.14 1021.89 1121.6 1033.49 1091.36C1045.83 1058 1043.05 989.034 1007.16 970.154C971.741 955.134 917.521 976.334 879.111 976.834C832.741 978.914 784.031 951.134 756.871 914.334C740.281 890.654 731.611 864.354 730.861 835.454Z"
      />
    </svg>
  );
}

type InvoiceDocumentProps = {
  invoice: Invoice;
};

/**
 * A4-sized, paginated invoice document. Used both for the live on-screen
 * preview and as the browser's print target (window.print → Save as PDF).
 * Line items are pre-split into pages by paginateInvoiceItems so each
 * printed page can carry an explicit "Page X of Y" footer — real CSS page
 * counters aren't reliably supported across browsers for print.
 */
export function InvoiceDocument({ invoice }: InvoiceDocumentProps) {
  const pages = paginateInvoiceItems(invoice.items);
  const totalPages = pages.length;
  const subtotal = invoiceSubtotal(invoice.items);
  const total = invoiceTotal(invoice.items);

  return (
    <div id="invoice-print-area">
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === totalPages - 1;

        return (
          <div className="a4-page" key={pageIndex}>
            <div className="a4-page-content">
              {isFirst && (
                <header className="invoice-header">
                  <div className="invoice-header-brand">
                    <div className="invoice-brand-row">
                      <NalarMark className="invoice-logo" />
                      <div className="invoice-company-name">{invoice.company.name || "Nalar Labs"}</div>
                    </div>
                    <div className="invoice-contact-block">
                      {invoice.company.address && (
                        <div className="invoice-address">{invoice.company.address}</div>
                      )}
                      {invoice.company.email && <div className="invoice-address">{invoice.company.email}</div>}
                      {invoice.company.phone && <div className="invoice-address">{invoice.company.phone}</div>}
                    </div>
                  </div>
                  <div className="invoice-meta">
                    <div className="invoice-title">INVOICE</div>
                    <div className="invoice-meta-row">
                      <span>Invoice #</span>
                      <span>{invoice.number}</span>
                    </div>
                    <div className="invoice-meta-row">
                      <span>Date</span>
                      <span>{invoice.date}</span>
                    </div>
                    <div className="invoice-meta-row">
                      <span>Due date</span>
                      <span>{invoice.dueDate}</span>
                    </div>
                  </div>
                </header>
              )}

              {isFirst && (
                <section className="invoice-bill-to">
                  <div className="invoice-bill-to-label">Bill to</div>
                  <div className="invoice-client-name">{invoice.client.name || "—"}</div>
                  {invoice.client.address && <div className="invoice-address">{invoice.client.address}</div>}
                  {invoice.client.email && <div className="invoice-address">{invoice.client.email}</div>}
                  {invoice.client.phone && <div className="invoice-address">{invoice.client.phone}</div>}
                </section>
              )}

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th className="col-desc">Work item</th>
                    <th className="col-qty">Qty</th>
                    <th className="col-rate">Rate</th>
                    <th className="col-amount">Sub total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id}>
                      <td className="col-desc">
                        <ItemDescription text={item.description} />
                      </td>
                      <td className="col-qty">{item.qty}</td>
                      <td className="col-rate">{formatCurrency(item.rate)}</td>
                      <td className="col-amount">{formatCurrency(lineAmount(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isLast && (
                <section className="invoice-totals">
                  <div className="invoice-totals-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="invoice-totals-row invoice-total-grand">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </section>
              )}

              {isLast && (
                <section className="invoice-footer-info">
                  <div className="invoice-footer-col">
                    <div className="invoice-footer-label">Payment info</div>
                    <div className="invoice-footer-text">{invoice.payment.details || "—"}</div>
                  </div>
                  <div className="invoice-footer-col">
                    <div className="invoice-footer-label">Terms &amp; conditions</div>
                    <div className="invoice-footer-text">{invoice.payment.terms || "—"}</div>
                  </div>
                </section>
              )}
            </div>

            <div className="a4-page-number">
              Page {pageIndex + 1} of {totalPages}
            </div>
          </div>
        );
      })}
    </div>
  );
}
