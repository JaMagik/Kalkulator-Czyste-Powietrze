import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { documentationItems, heatItems, thermoItems, ventItems, energyOptions } from './data/programData';

// --- Komponenty pomocnicze (w jednym pliku dla prostoty) ---

function CostCategoryInput({ title, description, items, entries, updateEntry }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {description && <p>{description}</p>}
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

function ResultsDisplay({ form, results, supportLevel }) {
  if (!supportLevel) return null;

  if (supportLevel === 'none') {
    return (
      <div className="results"><p className="warning">Nie spełniasz kryteriów dochodowych programu. Dotacja nie przysługuje.</p></div>
    );
  }

  const exportResultsToPDF = () => { /* ... implementacja PDF ... */ };
  
  const levelText = {
    highest: 'Najwyższy – do 100 % netto',
    increased: 'Podwyższony – do 70 %',
    basic: 'Podstawowy – do 40 %'
  };

  return (
    <div className="results">
      <p className="beneficiary"><strong>Beneficjent:</strong> {form.name && form.address ? `${form.name}, ${form.address}`: ''}</p>
      <h2>Poziom dofinansowania: {levelText[supportLevel]}</h2>
      
      {/* Tabele wyników */}
      {results.docs.rows.length > 0 && <CategoryTable title="Dokumentacja" data={results.docs} />}
      {results.heat.rows.length > 0 && <CategoryTable title="Wymiana źródła ciepła" data={results.heat} />}
      {results.thermo.rows.length > 0 && <CategoryTable title="Prace termomodernizacyjne" data={results.thermo} />}
      {results.vent.rows.length > 0 && <CategoryTable title="Modernizacja systemu wentylacji" data={results.vent} />}
      
      <h3>Podsumowanie</h3>
      <table>
        <tbody>
          <tr><th>Kwota netto inwestycji</th><td>{results.totals.net.toFixed(2)} zł</td></tr>
          <tr><th>VAT</th><td>{results.totals.vat.toFixed(2)} zł</td></tr>
          <tr><th>Kwota brutto inwestycji</th><td>{results.totals.gross.toFixed(2)} zł</td></tr>
          <tr><th>Dofinansowanie</th><td>{results.totals.grant.toFixed(2)} zł</td></tr>
          <tr><th>Kwota dopłaty beneficjenta</th><td>{results.totals.beneficiary.toFixed(2)} zł</td></tr>
        </tbody>
      </table>
      <div className="actions" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>Zapisz jako PDF</button>
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
              <td>{row.name}</td><td>{row.quantity.toFixed(2)}</td><td>{row.costNet.toFixed(2)}</td><td>{row.vatAmount.toFixed(2)}</td><td>{row.gross.toFixed(2)}</td><td>{row.grant.toFixed(2)}</td><td>{row.beneficiary.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// --- Główny komponent App ---

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

export default function App() {
  const [form, setForm] = useState({
    name: '',
    address: '',
    // Zmieniamy pole dochodu na konkretną kwotę
    applicantIncome: '', // Roczny dochód wnioskodawcy (dla progu podstawowego)
    householdIncome: '', // Miesięczny dochód całego gospodarstwa
    people: '1',
    energy: 'high',
    replaceHeat: 'no',
    fullThermo: 'no',
  });

  const [docEntries, setDocEntries] = useState(initEntries(documentationItems));
  const [heatEntries, setHeatEntries] = useState(initEntries(heatItems));
  const [thermoEntries, setThermoEntries] = useState(initEntries(thermoItems));
  const [ventEntries, setVentEntries] = useState(initEntries(ventItems));

  const [supportLevel, setSupportLevel] = useState(null);
  const [results, setResults] = useState(null);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateEntry = (setter, id, field, value) => {
    setter(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const determineSupportLevel = () => {
    const applicantIncome = parseDecimal(form.applicantIncome);
    const householdIncome = parseDecimal(form.householdIncome);
    const people = parseInt(form.people, 10) || 1;
    const incomePerPerson = people > 0 ? householdIncome / people : 0;
    
    // Progi dochodowe (zgodnie z programem na 2025 r.)
    const THRESHOLDS = {
        HIGHEST: { SINGLE: 1894, MULTI: 1353 },
        INCREASED: { SINGLE: 2651, MULTI: 1894 },
        BASIC_ANNUAL: 135000,
    };

    // 1. Sprawdzenie progu najwyższego (kompleksowa termomodernizacja)
    if (form.fullThermo === 'yes') {
      if ((people === 1 && incomePerPerson <= THRESHOLDS.HIGHEST.SINGLE) ||
          (people > 1 && incomePerPerson <= THRESHOLDS.HIGHEST.MULTI)) {
        return 'highest';
      }
    }
    
    // 2. Sprawdzenie progu podwyższonego
    if ((people === 1 && incomePerPerson <= THRESHOLDS.INCREASED.SINGLE) ||
        (people > 1 && incomePerPerson <= THRESHOLDS.INCREASED.MULTI)) {
      return 'increased';
    }

    // 3. Sprawdzenie progu podstawowego
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
      const grantPerUnit = item.max100 * factor;
      const grant = Math.min(costNet, qty * grantPerUnit);
      const vatAmount = costNet * vatRate;
      
      result.rows.push({ name: item.name, quantity: qty, costNet, vatAmount, gross: costNet + vatAmount, grant, beneficiary: (costNet + vatAmount) - grant });
      result.net += costNet;
      result.vat += vatAmount;
      result.grant += grant;
    });
    
    result.gross = result.net + result.vat;
    result.beneficiary = result.gross - result.grant;
    return result;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const level = determineSupportLevel();
    setSupportLevel(level);

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
    };
    totals.gross = totals.net + totals.vat;
    
    // Limity dotacji
    const grantCap = { highest: 135000, increased: 99000, basic: 66000 }[level] || 0;
    totals.grant = Math.min(totals.grant, grantCap);
    totals.beneficiary = totals.gross - totals.grant;

    setResults({ docs, heat, thermo, vent, totals });
  };

  return (
    <div className="container">
      <h1>Kalkulator programu „Czyste Powietrze 2025”</h1>
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

        <CostCategoryInput title="Dokumentacja" items={documentationItems} entries={docEntries} updateEntry={(id, field, value) => updateEntry(setDocEntries, id, field, value)} />
        {form.replaceHeat === 'yes' && <CostCategoryInput title="Wymiana źródła ciepła" items={heatItems} entries={heatEntries} updateEntry={(id, field, value) => updateEntry(setHeatEntries, id, field, value)} />}
        {form.fullThermo === 'yes' && (
          <>
            <CostCategoryInput title="Prace termomodernizacyjne" items={thermoItems} entries={thermoEntries} updateEntry={(id, field, value) => updateEntry(setThermoEntries, id, field, value)} />
            <CostCategoryInput title="Modernizacja systemu wentylacji" items={ventItems} entries={ventEntries} updateEntry={(id, field, value) => updateEntry(setVentEntries, id, field, value)} />
          </>
        )}

        <div className="actions"><button type="submit">Oblicz</button></div>
      </form>

      {results && <ResultsDisplay form={form} results={results} supportLevel={supportLevel} />}
    </div>
  );
}