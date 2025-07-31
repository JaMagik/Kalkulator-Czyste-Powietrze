import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { documentationItems, heatItems, thermoItems, ventItems, energyOptions } from './data/programData';
import latoFont from './assets/Lato-Regular.ttf';
import logo from './assets/Grupa Kaman.png'; // Importowanie logo

// --- FUNKCJE POMOCNICZE ---

const initEntries = items => {
  const obj = {};
  items.forEach(item => {
    obj[item.id] = { quantity: '', price: '', vat: item.vat };
  });
  return obj;
};

const parseDecimal = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  return parseFloat(value.toString().replace(',', '.')) || 0;
};

const formatNumber = (num) => {
  if (num % 1 === 0) {
    return num.toFixed(0);
  }
  return num.toFixed(2);
};


// --- Komponenty pomocnicze ---

function CostCategoryInput({ title, description, items, entries, updateEntry, maxGrant }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <p>
        {description}
        {maxGrant > 0 && (
          <strong style={{ display: 'block', marginTop: '5px' }}>
            Maksymalna dotacja w tej kategorii: {maxGrant.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
          </strong>
        )}
      </p>
      <table>
        <thead>
          <tr>
            <th>Pozycja</th>
            <th>Ilość</th>
            <th>Cena jedn. netto (zł)</th>
            <th>VAT</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td><input type="number" min="0" step={item.unit === 'm²' ? '0.01' : '1'} value={entries[item.id].quantity} onChange={e => updateEntry(item.id, 'quantity', e.target.value)} /></td>
              <td><input type="number" min="0" step="0.01" value={entries[item.id].price} onChange={e => updateEntry(item.id, 'price', e.target.value)} /></td>
              <td>
                <select value={entries[item.id].vat} onChange={e => updateEntry(item.id, 'vat', e.target.value)}>
                  <option value="0">0 %</option>
                  <option value="8">8 %</option>
                  <option value="23">23 %</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </fieldset>
  );
}

function ResultsDisplay({ form, results, supportLevel, maxGrants }) {
    if (!supportLevel) return null;

    if (supportLevel === 'none') {
        return (
            <div className="results"><p className="warning">Nie spełniasz kryteriów dochodowych programu. Dotacja nie przysługuje.</p></div>
        );
    }

    const levelText = {
        highest: 'Najwyższy – do 100 % netto',
        increased: 'Podwyższony – do 70 %',
        basic: 'Podstawowy – do 40 %'
    };

    const exportResultsToPDF = async () => {
        if (!results) return;

        // Równoległe pobieranie czcionki i logo
        const [fontResponse, logoResponse] = await Promise.all([
            fetch(latoFont),
            fetch(logo)
        ]);
        const fontBlob = await fontResponse.blob();
        const logoBlob = await logoResponse.blob();

        const toBase64 = blob => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const fontB64 = await toBase64(fontBlob);
        const logoB64 = await toBase64(logoBlob);

        const doc = new jsPDF();
        
        // Dodawanie czcionki
        const base64Font = fontB64.split(',')[1];
        doc.addFileToVFS('Lato-Regular.ttf', base64Font);
        doc.addFont('Lato-Regular.ttf', 'Lato', 'normal');
        doc.setFont('Lato');

        // Dodawanie logo na górze
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoWidth = 60;
        const logoHeight = 15;
        const x = (pageWidth / 2) - (logoWidth / 2);
        doc.addImage(logoB64, 'PNG', x, 15, logoWidth, logoHeight);

        // Dodawanie tytułu pod logo
        let currentY = 15 + logoHeight + 15;
        doc.setFontSize(18);
        doc.text('Kalkulacja Czyste Powietrze', pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // Dane beneficjenta
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Beneficjent: ${form.name || 'Brak danych'}, ${form.address || 'Brak danych'}`, 14, currentY);
        currentY += 6;
        doc.text(`Poziom dofinansowania: ${levelText[supportLevel]}`, 14, currentY);
        currentY += 10;

        // Pierwsza tabela
        autoTable(doc, {
            startY: currentY,
            head: [['Podsumowanie finansowe', 'Kwota']],
            body: [
                ['Kwota netto inwestycji', `${formatNumber(results.totals.net)} zł`],
                ['VAT', `${formatNumber(results.totals.vat)} zł`],
                ['Kwota brutto inwestycji', `${formatNumber(results.totals.gross)} zł`],
                ['Przyznane dofinansowanie', `${formatNumber(results.totals.grant)} zł`],
                ['Wkład własny beneficjenta', `${formatNumber(results.totals.beneficiary)} zł`],
            ],
            theme: 'striped',
            styles: { font: 'Lato', fontStyle: 'normal' },
            headStyles: { fillColor: '#2c3e50', textColor: 'white' },
        });

        const generateCategoryTable = (title, data) => {
            if (data && data.rows.length > 0 && data.net > 0) {
                autoTable(doc, {
                    startY: doc.lastAutoTable.finalY + 12,
                    head: [
                      [{ content: title, colSpan: 7, styles: { halign: 'center', fillColor: '#34495e' } }],
                      ['Pozycja', 'Ilość', 'Netto', 'VAT', 'Brutto', 'Dotacja', 'Wkład']
                    ],
                    body: data.rows.map(row => [
                        String(row.name), String(formatNumber(row.quantity)), `${formatNumber(row.costNet)} zł`, `${formatNumber(row.vatAmount)} zł`,
                        `${formatNumber(row.gross)} zł`, `${formatNumber(row.grant)} zł`, `${formatNumber(row.beneficiary)} zł`,
                    ]),
                    theme: 'grid',
                    styles: { font: 'Lato', fontStyle: 'normal' },
                    headStyles: { fillColor: '#7f8c8d', textColor: 'white' },
                });
            }
        };

        generateCategoryTable('Dokumentacja', results.docs);
        generateCategoryTable('Wymiana źródła ciepła', results.heat);
        generateCategoryTable('Prace termomodernizacyjne', results.thermo);
        generateCategoryTable('Modernizacja systemu wentylacji', results.vent);
        
        doc.addPage();
        
        const summaryBody = [];
        if (maxGrants.docs > 0) {
            summaryBody.push(['Dokumentacja', `${formatNumber(maxGrants.docs)} zł`, `${formatNumber(results.docs.grant)} zł`]);
        }
        if (form.replaceHeat === 'yes' && maxGrants.heat > 0) {
            summaryBody.push(['Wymiana źródła ciepła', `${formatNumber(maxGrants.heat)} zł`, `${formatNumber(results.heat.grant)} zł`]);
        }
        if (form.fullThermo === 'yes' && maxGrants.thermo > 0) {
            summaryBody.push(['Prace termomodernizacyjne', `${formatNumber(maxGrants.thermo)} zł`, `${formatNumber(results.thermo.grant)} zł`]);
        }
        if (form.fullThermo === 'yes' && maxGrants.vent > 0) {
            summaryBody.push(['Modernizacja systemu wentylacji', `${formatNumber(maxGrants.vent)} zł`, `${formatNumber(results.vent.grant)} zł`]);
        }

        if (summaryBody.length > 0) {
            autoTable(doc, {
                startY: 20,
                head: [
                    [{ content: 'Podsumowanie wykorzystania dotacji w kategoriach', colSpan: 3, styles: { halign: 'center', fillColor: '#34495e' } }],
                    ['Kategoria', 'Maksymalna dotacja w kategorii', 'Wykorzystano z dotacji']
                ],
                body: summaryBody,
                theme: 'grid',
                styles: { font: 'Lato', fontStyle: 'normal' },
                headStyles: { fillColor: '#7f8c8d', textColor: 'white' },
            });
        }

        const grantCap = { highest: 135000, increased: 99000, basic: 66000 }[supportLevel] || 0;
        let totalMaxGrantForScope = maxGrants.docs;
        if (form.replaceHeat === 'yes') totalMaxGrantForScope += maxGrants.heat;
        if (form.fullThermo === 'yes') {
            totalMaxGrantForScope += maxGrants.thermo;
            totalMaxGrantForScope += maxGrants.vent;
        }
        const finalPossibleGrant = Math.min(totalMaxGrantForScope, grantCap);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 12,
            head: [['Podsumowanie końcowe', 'Kwota']],
            body: [
                ['Maksymalna dotacja możliwa do uzyskania dla wybranych prac', `${formatNumber(finalPossibleGrant)} zł`],
                ['Przyznana dotacja w ramach tej kalkulacji', `${formatNumber(results.totals.grant)} zł`]
            ],
            theme: 'striped',
            styles: { font: 'Lato', fontStyle: 'normal' },
            headStyles: { fillColor: '#2c3e50', textColor: 'white' },
        });

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('Lato', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Strona ${i} z ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
            doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 14, doc.internal.pageSize.height - 10);
        }
        
        doc.save('CzystePowietrze-Kalkulacja.pdf');
    };

    return (
        <div className="results">
            <p className="beneficiary"><strong>Beneficjent:</strong> {form.name && form.address ? `${form.name}, ${form.address}` : ''}</p>
            <h2>Poziom dofinansowania: {levelText[supportLevel]}</h2>
            
            {results.docs.rows.length > 0 && <CategoryTable title="Dokumentacja" data={results.docs} />}
            {results.heat.rows.length > 0 && <CategoryTable title="Wymiana źródła ciepła" data={results.heat} />}
            {results.thermo.rows.length > 0 && <CategoryTable title="Prace termomodernizacyjne" data={results.thermo} />}
            {results.vent.rows.length > 0 && <CategoryTable title="Modernizacja systemu wentylacji" data={results.vent} />}
            
            <h3>Podsumowanie</h3>
            <table>
                <tbody>
                    <tr><th>Kwota netto inwestycji</th><td>{formatNumber(results.totals.net)} zł</td></tr>
                    <tr><th>VAT</th><td>{formatNumber(results.totals.vat)} zł</td></tr>
                    <tr><th>Kwota brutto inwestycji</th><td>{formatNumber(results.totals.gross)} zł</td></tr>
                    <tr><th>Dofinansowanie</th><td>{formatNumber(results.totals.grant)} zł</td></tr>
                    <tr><th>Kwota dopłaty beneficjenta</th><td>{formatNumber(results.totals.beneficiary)} zł</td></tr>
                </tbody>
            </table>
            <div className="actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={exportResultsToPDF}>Eksportuj do PDF</button>
                <button type="button" className="btn-secondary" onClick={() => window.print()}>Drukuj</button>
            </div>
        </div>
    );
}

function CategoryTable({ title, data }) {
    if (!data || !data.rows || data.rows.length === 0) return null;
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Pozycja</th><th>Ilość</th><th>Koszt netto</th><th>VAT</th><th>Koszt brutto</th><th>Dofinansowanie</th><th>Dopłata beneficjenta</th>
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row, idx) => (
                        <tr key={idx}>
                            <td>{row.name}</td><td>{formatNumber(row.quantity)}</td><td>{formatNumber(row.costNet)}</td><td>{formatNumber(row.vatAmount)}</td>
                            <td>{formatNumber(row.gross)}</td><td>{formatNumber(row.grant)}</td><td>{formatNumber(row.beneficiary)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


// --- Główny komponent App ---

export default function App() {
  const [form, setForm] = useState({
    name: '',
    address: '',
    applicantIncome: '',
    householdIncome: '', 
    people: '1',
    energy: 'high',
    replaceHeat: 'no',
    fullThermo: 'no',
  });

  const [docEntries, setDocEntries] = useState(initEntries(documentationItems));
  const [heatEntries, setHeatEntries] = useState(initEntries(heatItems));
  const [thermoEntries, setThermoEntries] = useState(initEntries(thermoItems));
  const [ventEntries, setVentEntries] = useState(initEntries(ventItems));

  const [results, setResults] = useState(null);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateEntry = (setter, id, field, value) => {
    setter(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const determineSupportLevel = (formData) => {
    const applicantIncome = parseDecimal(formData.applicantIncome);
    const householdIncome = parseDecimal(formData.householdIncome);
    const people = parseInt(formData.people, 10) || 1;
    const incomePerPerson = people > 0 ? householdIncome / people : 0;
    
    const THRESHOLDS = {
        HIGHEST: { SINGLE: 1894, MULTI: 1353 },
        INCREASED: { SINGLE: 2651, MULTI: 1894 },
        BASIC_ANNUAL: 135000,
    };

    if (formData.fullThermo === 'yes') {
        if ((people === 1 && incomePerPerson <= THRESHOLDS.HIGHEST.SINGLE) ||
            (people > 1 && incomePerPerson <= THRESHOLDS.HIGHEST.MULTI)) {
          return 'highest';
        }
    }
    
    if ((people === 1 && incomePerPerson <= THRESHOLDS.INCREASED.SINGLE) ||
        (people > 1 && incomePerPerson <= THRESHOLDS.INCREASED.MULTI)) {
      return 'increased';
    }

    if (applicantIncome <= THRESHOLDS.BASIC_ANNUAL) {
      return 'basic';
    }

    return 'none';
  };

  const computeCategory = (items, entries, level) => {
    const factor = { highest: 1.0, increased: 0.7, basic: 0.4 }[level] || 0.0;
    const result = { rows: [], net: 0, vat: 0, gross: 0, grant: 0, beneficiary: 0 };
    
    items.forEach(item => {
      const entry = entries[item.id] || {};
      const qty = parseDecimal(entry.quantity);
      const price = parseDecimal(entry.price);
      if (!qty || !price) return;
      
      const vatRate = parseDecimal(entry.vat) / 100;
      const costNet = qty * price;
      
      const maxGrantForItem = item.max100 * factor;
      const grant = Math.min(costNet, maxGrantForItem);
      
      const vatAmount = costNet * vatRate;
      const gross = Math.round(costNet + vatAmount);
      const beneficiary = gross - grant;

      result.rows.push({ name: item.name, quantity: qty, costNet, vatAmount, gross, grant, beneficiary });
      result.net += costNet;
      result.vat += vatAmount;
      result.grant += grant;
      result.gross += gross;
    });
    
    result.beneficiary = result.gross - result.grant;
    return result;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const level = determineSupportLevel(form);

    if (level === 'none') {
      setResults(null); 
      return;
    }

    const docs = computeCategory(documentationItems, docEntries, level);
    const heat = form.replaceHeat === 'yes' ? computeCategory(heatItems, heatEntries, level) : { rows: [], net: 0, vat: 0, gross: 0, grant: 0, beneficiary: 0 };
    const thermo = form.fullThermo === 'yes' ? computeCategory(thermoItems, thermoEntries, level) : { rows: [], net: 0, vat: 0, gross: 0, grant: 0, beneficiary: 0 };
    const vent = form.fullThermo === 'yes' ? computeCategory(ventItems, ventEntries, level) : { rows: [], net: 0, vat: 0, gross: 0, grant: 0, beneficiary: 0 };

    const totals = {
      net: docs.net + heat.net + thermo.net + vent.net,
      vat: docs.vat + heat.vat + thermo.vat + vent.vat,
      grant: docs.grant + heat.grant + thermo.grant + vent.grant,
      gross: docs.gross + heat.gross + thermo.gross + vent.gross,
    };
    
    const grantCap = { highest: 135000, increased: 99000, basic: 66000 }[level] || 0;
    totals.grant = Math.min(totals.grant, grantCap);
    totals.beneficiary = totals.gross - totals.grant;

    setResults({ docs, heat, thermo, vent, totals, level });
  };
  
  const currentSupportLevel = useMemo(() => determineSupportLevel(form), [form]);

  const calculateMaxGrantForCategory = (items, level, entries) => {
      if (!level || level === 'none') return 0;
      const factor = { highest: 1.0, increased: 0.7, basic: 0.4 }[level];
      let totalMaxGrant = 0;

      items.forEach(item => {
          const entry = entries[item.id] || {};
          if (parseDecimal(entry.quantity) > 0) {
              totalMaxGrant += item.max100 * factor;
          }
      });
      return totalMaxGrant;
  };

  const calculateMaxGrantForHeat = (items, level, entries) => {
      if (!level || level === 'none') return 0;
      const factor = { highest: 1.0, increased: 0.7, basic: 0.4 }[level];
      let maxHeatSourceGrant = 0;
      let centralHeatingGrant = 0;

      items.forEach(item => {
          const entry = entries[item.id] || {};
          if (parseDecimal(entry.quantity) > 0) {
              if (item.id === 'central_heating') {
                  centralHeatingGrant = item.max100 * factor;
              } else {
                  maxHeatSourceGrant = Math.max(maxHeatSourceGrant, item.max100 * factor);
              }
          }
      });
      return maxHeatSourceGrant + centralHeatingGrant;
  };

  const maxGrantDocs = useMemo(() => calculateMaxGrantForCategory(documentationItems, currentSupportLevel, docEntries), [currentSupportLevel, docEntries]);
  const maxGrantHeat = useMemo(() => calculateMaxGrantForHeat(heatItems, currentSupportLevel, heatEntries), [currentSupportLevel, heatEntries]);
  const maxGrantThermo = useMemo(() => calculateMaxGrantForCategory(thermoItems, currentSupportLevel, thermoEntries), [currentSupportLevel, thermoEntries]);
  const maxGrantVent = useMemo(() => calculateMaxGrantForCategory(ventItems, currentSupportLevel, ventEntries), [currentSupportLevel, ventEntries]);

  return (
    <div className="container">
      <img src={logo} alt="Logo Kalkulatora" className="app-logo" />
      <h1>Kalkulacja Czyste Powietrze</h1>
      <p>
        Ten kalkulator pozwala oszacować maksymalne dofinansowanie w ramach programu. Wprowadź dane, aby określić poziom wsparcia i obliczyć kwotę dotacji.
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset className="beneficiary-form">
          <legend>Dane beneficjenta</legend>
          <label>Imię i nazwisko<input name="name" type="text" value={form.name} onChange={handleFormChange} /></label>
          <label>Adres inwestycji<input name="address" type="text" value={form.address} onChange={handleFormChange} /></label>
          
          <label title="Dla progu podstawowego">Roczny dochód wnioskodawcy (zł)
            <input name="applicantIncome" type="number" step="0.01" value={form.applicantIncome} onChange={handleFormChange} placeholder="np. 85000"/>
          </label>
          <label title="Dla progu podwyższonego i najwyższego">Łączny miesięczny dochód gospodarstwa (zł)
            <input name="householdIncome" type="number" step="0.01" value={form.householdIncome} onChange={handleFormChange} placeholder="np. 2500"/>
          </label>
          <label>Liczba osób w gospodarstwie domowym
            <input name="people" type="number" step="1" min="1" value={form.people} onChange={handleFormChange} required />
          </label>
          <label>Efektywność energetyczna budynku (przed realizacją)
            <select name="energy" value={form.energy} onChange={handleFormChange}>
              {energyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label>Czy wymieniasz źródło ciepła?
            <select name="replaceHeat" value={form.replaceHeat} onChange={handleFormChange}>
              <option value="no">Nie</option><option value="yes">Tak</option>
            </select>
          </label>
          <label>Czy planujesz kompleksową termomodernizację?
            <select name="fullThermo" value={form.fullThermo} onChange={handleFormChange}>
              <option value="no">Nie</option><option value="yes">Tak</option>
            </select>
          </label>
        </fieldset>

        <CostCategoryInput title="Dokumentacja" items={documentationItems} entries={docEntries} updateEntry={(id, field, value) => updateEntry(setDocEntries, id, field, value)} maxGrant={maxGrantDocs} />
        {form.replaceHeat === 'yes' && <CostCategoryInput title="Wymiana źródła ciepła" items={heatItems} entries={heatEntries} updateEntry={(id, field, value) => updateEntry(setHeatEntries, id, field, value)} maxGrant={maxGrantHeat} />}
        {form.fullThermo === 'yes' && (
          <>
            <CostCategoryInput title="Prace termomodernizacyjne" items={thermoItems} entries={thermoEntries} updateEntry={(id, field, value) => updateEntry(setThermoEntries, id, field, value)} maxGrant={maxGrantThermo} />
            <CostCategoryInput title="Modernizacja systemu wentylacji" items={ventItems} entries={ventEntries} updateEntry={(id, field, value) => updateEntry(setVentEntries, id, field, value)} maxGrant={maxGrantVent} />
          </>
        )}

        <div className="actions"><button type="submit">Oblicz</button></div>
      </form>

      {results && <ResultsDisplay 
                    form={form} 
                    results={results} 
                    supportLevel={results.level} 
                    maxGrants={{
                        docs: maxGrantDocs,
                        heat: maxGrantHeat,
                        thermo: maxGrantThermo,
                        vent: maxGrantVent
                    }}
                  />}
    </div>
  );
}