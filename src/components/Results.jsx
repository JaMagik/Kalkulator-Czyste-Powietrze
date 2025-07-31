import React from 'react';
import { jsPDF } from "jspdf";

function CategoryTable({ title, data }) {
  if (!data || !data.rows || data.rows.length === 0) return null;
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Pozycja</th>
            <th>Ilość</th>
            <th>Koszt netto</th>
            <th>VAT</th>
            <th>Koszt brutto</th>
            <th>Dofinansowanie</th>
            <th>Dopłata beneficjenta</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.name}</td>
              <td>{row.quantity.toFixed(2)}</td>
              <td>{row.costNet.toFixed(2)}</td>
              <td>{row.vatAmount.toFixed(2)}</td>
              <td>{row.gross.toFixed(2)}</td>
              <td>{row.grant.toFixed(2)}</td>
              <td>{row.beneficiary.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Results({ form, results, supportLevel }) {
  if (!supportLevel) return null;

  if (supportLevel === 'none') {
    return (
      <div className="results">
        <p className="warning">
          Nie spełniasz kryteriów programu – zbyt wysokie dochody lub
          niewystarczająca energochłonność budynku. Dotacja nie
          przysługuje.
        </p>
      </div>
    );
  }

  const exportResultsToPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text("Kalkulator programu „Czyste Powietrze 2025”", 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Beneficjent: ${form.name}, ${form.address}`, 10, y);
    y += 10;
    doc.text(
      `Poziom dofinansowania: ${
        supportLevel === "highest"
          ? "Najwyższy – do 100 % netto"
          : supportLevel === "increased"
          ? "Podwyższony – do 70 %"
          : "Podstawowy – do 40 %"
      }`,
      10,
      y
    );
    y += 10;

    doc.text(`Kwota netto inwestycji: ${results.totals.net.toFixed(2)} zł`, 10, y); y += 7;
    doc.text(`VAT: ${results.totals.vat.toFixed(2)} zł`, 10, y); y += 7;
    doc.text(`Kwota brutto inwestycji: ${results.totals.gross.toFixed(2)} zł`, 10, y); y += 7;
    doc.text(`Dofinansowanie: ${results.totals.grant.toFixed(2)} zł`, 10, y); y += 7;
    doc.text(`Kwota dopłaty beneficjenta: ${results.totals.beneficiary.toFixed(2)} zł`, 10, y); y += 10;

    const addCategory = (title, data) => {
      if (!data || !data.rows || data.rows.length === 0) return;
      doc.setFontSize(12);
      doc.text(title, 10, y); y += 7;
      data.rows.forEach(row => {
        doc.text(
          `${row.name}: ilość ${row.quantity}, netto ${row.costNet.toFixed(2)} zł, VAT ${row.vatAmount.toFixed(2)} zł, brutto ${row.gross.toFixed(2)} zł, dofinansowanie ${row.grant.toFixed(2)} zł, dopłata ${row.beneficiary.toFixed(2)} zł`,
          10,
          y
        );
        y += 7;
        if (y > 280) { doc.addPage(); y = 10; }
      });
      y += 3;
    };

    addCategory("Dokumentacja", results.docs);
    if (form.replaceHeat === 'yes') addCategory("Wymiana źródła ciepła", results.heat);
    if (form.fullThermo === 'yes') {
      addCategory("Prace termomodernizacyjne", results.thermo);
      addCategory("Modernizacja systemu wentylacji", results.vent);
    }

    doc.save("kalkulator_czyste_powietrze.pdf");
  };
  
  return (
    <div className="results">
      <p className="beneficiary">
        <strong>Beneficjent:</strong>{' '}
        {form.name && form.address
          ? `${form.name}, ${form.address}`
          : form.name || form.address || ''}
      </p>
      <h2>
        Poziom dofinansowania:{' '}
        {supportLevel === 'highest'
          ? 'Najwyższy – do 100 % netto'
          : supportLevel === 'increased'
          ? 'Podwyższony – do 70 %'
          : 'Podstawowy – do 40 %'}
      </h2>
      <CategoryTable title="Dokumentacja" data={results.docs} />
      {form.replaceHeat === 'yes' && (
        <CategoryTable title="Wymiana źródła ciepła" data={results.heat} />
      )}
      {form.fullThermo === 'yes' && (
        <>
          <CategoryTable title="Prace termomodernizacyjne" data={results.thermo} />
          <CategoryTable title="Modernizacja systemu wentylacji" data={results.vent} />
        </>
      )}
      <h3>Podsumowanie</h3>
      <table>
        <tbody>
          <tr>
            <th>Kwota netto inwestycji</th>
            <td>{results.totals.net.toFixed(2)} zł</td>
          </tr>
          <tr>
            <th>VAT</th>
            <td>{results.totals.vat.toFixed(2)} zł</td>
          </tr>
          <tr>
            <th>Kwota brutto inwestycji</th>
            <td>{results.totals.gross.toFixed(2)} zł</td>
          </tr>
          <tr>
            <th>Dofinansowanie</th>
            <td>{results.totals.grant.toFixed(2)} zł</td>
          </tr>
          <tr>
            <th>Kwota dopłaty beneficjenta</th>
            <td>{results.totals.beneficiary.toFixed(2)} zł</td>
          </tr>
        </tbody>
      </table>
      <div className="actions" style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={exportResultsToPDF}
        >
          Eksportuj do PDF
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.print()}
        >
          Zapisz jako PDF
        </button>
      </div>
    </div>
  );
}

export default Results;