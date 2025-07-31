import React from 'react';

function CostCategory({ title, description, items, entries, updateEntry }) {
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
              <td>
                <input
                  type="number"
                  min="0"
                  step={item.unit === 'm²' ? '0.01' : '1'}
                  value={entries[item.id].quantity}
                  onChange={e => updateEntry(item.id, 'quantity', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entries[item.id].price}
                  onChange={e => updateEntry(item.id, 'price', e.target.value)}
                />
              </td>
              <td>
                <select
                  value={entries[item.id].vat}
                  onChange={e => updateEntry(item.id, 'vat', e.target.value)}
                >
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

export default CostCategory;