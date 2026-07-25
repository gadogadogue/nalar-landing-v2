import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { InvoiceAdminPage } from "./app/admin/invoice/InvoiceAdminPage.tsx";
import "./styles/index.css";

// No router library is wired up elsewhere in this app, so this is a
// deliberately minimal path check rather than pulling in react-router.
const isInvoiceAdmin = window.location.pathname.startsWith("/admin/invoice");

createRoot(document.getElementById("root")!).render(
  isInvoiceAdmin ? <InvoiceAdminPage /> : <App />,
);
