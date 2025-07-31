import React from 'react';
import { energyOptions, incomeOptions } from '../data/programData';

function BeneficiaryForm({ form, handleFormChange }) {
  return (
    <fieldset className="beneficiary-form">
      <legend>Dane beneficjenta</legend>
      <label>
        Imię i nazwisko
        <input
          name="name"
          type="text"
          value={form.name}
          onChange={handleFormChange}
          required
        />
      </label>
      <label>
        Adres inwestycji
        <input
          name="address"
          type="text"
          value={form.address}
          onChange={handleFormChange}
          required
        />
      </label>
      <label>
        Efektywność energetyczna budynku (EU)
        <select
          name="energy"
          value={form.energy}
          onChange={handleFormChange}
        >
          {energyOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Miesięczny dochód na osobę
        <select
          name="income"
          value={form.income}
          onChange={handleFormChange}
        >
          {incomeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Liczba osób w gospodarstwie domowym
        <input
          name="people"
          type="number"
          step="1"
          min="1"
          value={form.people}
          onChange={handleFormChange}
          required
        />
      </label>
      <label>
        Czy wymieniasz źródło ciepła?
        <select
          name="replaceHeat"
          value={form.replaceHeat}
          onChange={handleFormChange}
        >
          <option value="no">Nie</option>
          <option value="yes">Tak</option>
        </select>
      </label>
      <label>
        Czy planujesz kompleksową termomodernizację?
        <select
          name="fullThermo"
          value={form.fullThermo}
          onChange={handleFormChange}
        >
          <option value="no">Nie</option>
          <option value="yes">Tak</option>
        </select>
      </label>
    </fieldset>
  );
}

export default BeneficiaryForm;