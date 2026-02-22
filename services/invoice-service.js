import PDFDocument from "pdfkit";

/**
 * generateInvoicePDF — streams a professional invoice PDF into the given writable stream.
 * @param {Object}   order  - fully populated order document (with userId, items, etc.)
 * @param {Writable} stream - a writable stream (e.g. res, or a file write stream)
 */
const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(stream);

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ── Colors ──────────────────────────────────────────────────────────────────
  const PRIMARY = "#0f172a"; // slate-900
  const SECONDARY = "#64748b"; // slate-500
  const ACCENT = "#10b981"; // emerald-500
  const LIGHT_BG = "#f8fafc"; // slate-50
  const BORDER = "#e2e8f0"; // slate-200

  // ── Header ──────────────────────────────────────────────────────────────────
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor(PRIMARY)
    .text("E-CITY", 50, 50);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(SECONDARY)
    .text("Premium Electronics Store", 50, 78)
    .text("www.e-city.in", 50, 90);

  // Invoice label — top right
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor(PRIMARY)
    .text("INVOICE", 350, 50, { width: pageWidth - 300, align: "right" });

  // ── Invoice Meta ────────────────────────────────────────────────────────────
  const metaY = 120;
  const orderId = order._id.toString();
  const invoiceNo = `INV-${orderId.slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc.fontSize(9).font("Helvetica-Bold").fillColor(SECONDARY);
  doc.text("Invoice No:", 50, metaY);
  doc.text("Date:", 50, metaY + 16);
  doc.text("Order ID:", 50, metaY + 32);
  doc.text("Payment:", 50, metaY + 48);

  doc.font("Helvetica").fillColor(PRIMARY);
  doc.text(invoiceNo, 140, metaY);
  doc.text(orderDate, 140, metaY + 16);
  doc.text(`#${orderId.slice(-6).toUpperCase()}`, 140, metaY + 32);
  doc.text(`${order.paymentMethod} — ${order.paymentStatus}`, 140, metaY + 48);

  // ── Customer Info — right side ──────────────────────────────────────────────
  const customer = order.userId || {};
  const addr = order.shippingAddress || {};

  doc.fontSize(9).font("Helvetica-Bold").fillColor(SECONDARY);
  doc.text("Bill To:", 350, metaY, { width: pageWidth - 300, align: "right" });

  doc.font("Helvetica").fillColor(PRIMARY);
  doc.text(
    `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
      customer.name ||
      "Customer",
    350,
    metaY + 16,
    { width: pageWidth - 300, align: "right" },
  );
  doc.text(addr.address || "", 350, metaY + 32, {
    width: pageWidth - 300,
    align: "right",
  });
  doc.text(
    [addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
    350,
    metaY + 48,
    { width: pageWidth - 300, align: "right" },
  );
  doc.text(addr.phone || "", 350, metaY + 64, {
    width: pageWidth - 300,
    align: "right",
  });

  // ── Divider ─────────────────────────────────────────────────────────────────
  const dividerY = metaY + 90;
  doc
    .moveTo(50, dividerY)
    .lineTo(50 + pageWidth, dividerY)
    .strokeColor(BORDER)
    .lineWidth(1)
    .stroke();

  // ── Items Table Header ──────────────────────────────────────────────────────
  const tableTop = dividerY + 15;
  const col = {
    item: 50,
    qty: 330,
    price: 390,
    total: 460,
  };

  // Header bg
  doc.rect(50, tableTop - 5, pageWidth, 22).fill(LIGHT_BG);

  doc.fontSize(8).font("Helvetica-Bold").fillColor(SECONDARY);
  doc.text("ITEM", col.item + 5, tableTop, { width: 270 });
  doc.text("QTY", col.qty, tableTop, { width: 50, align: "center" });
  doc.text("PRICE", col.price, tableTop, { width: 60, align: "right" });
  doc.text("TOTAL", col.total, tableTop, { width: 55, align: "right" });

  // ── Items ───────────────────────────────────────────────────────────────────
  let y = tableTop + 28;
  doc.font("Helvetica").fillColor(PRIMARY);

  for (const item of order.items) {
    const title = item.title || item.baseProductId?.title || "Product";
    const attrs = item.attributes
      ? Object.values(item.attributes).join(" / ")
      : "";
    const lineTotal = item.priceAtOrder * item.quantity;

    // Check if we need a new page
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(9).font("Helvetica-Bold").fillColor(PRIMARY);
    doc.text(title, col.item + 5, y, { width: 270 });

    if (attrs) {
      doc.fontSize(7).font("Helvetica").fillColor(SECONDARY);
      doc.text(attrs, col.item + 5, y + 13, { width: 270 });
    }

    // IMEI / Serial if unique
    if (item.inventoryUnitId) {
      const unit = item.inventoryUnitId;
      const unitInfo = [
        unit.imei ? `IMEI: ${unit.imei}` : "",
        unit.serialNumber ? `S/N: ${unit.serialNumber}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      if (unitInfo) {
        doc.fontSize(7).font("Helvetica").fillColor(ACCENT);
        doc.text(unitInfo, col.item + 5, y + (attrs ? 23 : 13), { width: 270 });
      }
    }

    doc.fontSize(9).font("Helvetica").fillColor(PRIMARY);
    doc.text(String(item.quantity), col.qty, y, {
      width: 50,
      align: "center",
    });
    doc.text(`₹${item.priceAtOrder.toLocaleString("en-IN")}`, col.price, y, {
      width: 60,
      align: "right",
    });
    doc.font("Helvetica-Bold");
    doc.text(`₹${lineTotal.toLocaleString("en-IN")}`, col.total, y, {
      width: 55,
      align: "right",
    });

    // Row separator
    const rowHeight = attrs ? 35 : 22;
    y += rowHeight + 5;
    doc
      .moveTo(col.item, y - 3)
      .lineTo(50 + pageWidth, y - 3)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();
    y += 5;
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalsX = 370;
  const totalsLabelW = 80;
  const totalsValueW = 65;
  y += 10;

  // Subtotal
  doc.fontSize(9).font("Helvetica").fillColor(SECONDARY);
  doc.text("Subtotal", totalsX, y, { width: totalsLabelW, align: "right" });
  doc.fillColor(PRIMARY);
  doc.text(
    `₹${order.subtotal.toLocaleString("en-IN")}`,
    totalsX + totalsLabelW + 5,
    y,
    {
      width: totalsValueW,
      align: "right",
    },
  );

  y += 18;
  doc.fillColor(SECONDARY);
  doc.text("Shipping", totalsX, y, { width: totalsLabelW, align: "right" });
  doc.fillColor(ACCENT);
  doc.text(
    order.shippingFee > 0
      ? `₹${order.shippingFee.toLocaleString("en-IN")}`
      : "FREE",
    totalsX + totalsLabelW + 5,
    y,
    { width: totalsValueW, align: "right" },
  );

  // Total
  y += 25;
  doc
    .rect(totalsX - 10, y - 8, totalsLabelW + totalsValueW + 25, 28)
    .fill(PRIMARY);

  doc.fontSize(11).font("Helvetica-Bold").fillColor("#ffffff");
  doc.text("TOTAL", totalsX, y, { width: totalsLabelW, align: "right" });
  doc.text(
    `₹${order.totalAmount.toLocaleString("en-IN")}`,
    totalsX + totalsLabelW + 5,
    y,
    { width: totalsValueW, align: "right" },
  );

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - doc.page.margins.bottom - 40;
  doc
    .moveTo(50, footerY)
    .lineTo(50 + pageWidth, footerY)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(SECONDARY)
    .text("Thank you for shopping with E-City!", 50, footerY + 10, {
      width: pageWidth,
      align: "center",
    })
    .text("For support, contact us at support@e-city.in", 50, footerY + 22, {
      width: pageWidth,
      align: "center",
    });

  doc.end();
};

export default generateInvoicePDF;
