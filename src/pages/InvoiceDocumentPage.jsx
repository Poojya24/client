const lineItems = [
  ["Basmati Rice (5kg)", "1", "1,090"],
  ["Aashirvaad Atta (10kg)", "1", "?545"],
  ["Fortune Sunflower Oil (5L)", "1", "?1,090"],
  ["Amul Toned Milk (1L)", "5", "?273"],
  ["Tata Salt (1kg)", "2", "?55"],
  ["Maggi Noodles (12-pack)", "1", "?136"],
  ["Good Day Biscuits (10 packs)", "1", "?227"],
  ["Red Label Tea (500g)", "1", "?263"],
  ["Sugar (5kg)", "1", "?272"],
  ["Mixed Vegetables", "1set", "?1,090"]
];

function InvoiceDocumentPage({ variant }) {
  const compact = variant === "compact";

  return (
    <main className={`invoice-doc-page ${compact ? "compact" : ""}`}>
      <section className="invoice-doc">
        {!compact ? (
          <>
            <h1>INVOICE</h1>
            <div className="doc-address-row">
              <div>
                <strong>Billed to</strong>
                <p>Company Name</p>
                <p>Company address</p>
                <p>City, Country - 00000</p>
              </div>
              <div>
                <p>Business address</p>
                <p>City, State, IN - 000 000</p>
                <p>TAX ID 00XXXXX1234X0XX</p>
              </div>
            </div>
          </>
        ) : null}

        <div className="doc-content">
          <aside>
            <div><strong>Invoice #</strong><p>INV-1007</p></div>
            <div><strong>Invoice date</strong><p>01-Apr-2025</p></div>
            <div><strong>Reference</strong><p>INV-057</p></div>
            <div><strong>Due date</strong><p>15-Apr-2025</p></div>
          </aside>
          <table>
            <thead><tr><th>Products</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              {lineItems.map((row) => (
                <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>
              ))}
              <tr className="totals"><td>Subtotal<br />Tax (10%)<br /><span>Total due</span></td><td /><td>?5,090<br />?510<br /><span>?5,600</span></td></tr>
            </tbody>
          </table>
        </div>

        <p className="doc-note">Please pay within {compact ? "15" : "7"} days of receiving this invoice.</p>
        {!compact ? <footer><span>www.recehtol.inc</span><span>+91 00000 00000</span><span>hello@email.com</span></footer> : null}
      </section>
    </main>
  );
}

export default InvoiceDocumentPage;