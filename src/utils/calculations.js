import { incomeOptions, energyOptions } from '../data/programData';

export function parseDecimal(value) {
  if (value === undefined || value === null) return 0;
  const norm = value.toString().replace(',', '.');
  const parsed = parseFloat(norm);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Modyfikacja funkcji określającej poziom wsparcia zgodnie z wytycznymi programu na 2025 rok.
 * Główne zmiany:
 * 1. Najwyższy poziom dofinansowania (100%) jest teraz uzależniony od przeprowadzenia audytu
 * energetycznego i realizacji kompleksowej termomodernizacji, a nie od początkowego
 * wskaźnika zużycia energii (EU). Usunięto warunek `eu > 140`.
 * 2. Wprowadzono logikę zgodną z progami dochodowymi i wymogami audytu opisanymi
 * na oficjalnej stronie programu Czyste Powietrze.
 */
export function determineSupportLevel({ income, people, fullThermo, hasAudit }) {
  let inc;
  if (typeof income === 'string' && incomeOptions.some(opt => opt.value === income)) {
    const opt = incomeOptions.find(opt => opt.value === income);
    inc = opt ? opt.numeric : 0;
  } else {
    inc = parseDecimal(income);
  }
  const ppl = parseInt(people, 10) || 1;
  const comprehensive = fullThermo === 'yes';
  const auditPerformed = hasAudit === 'yes';

  // Najwyższy poziom dofinansowania (do 100%)
  // Wymagany audyt energetyczny i kompleksowa termomodernizacja.
  const isHighestEligible = (ppl === 1 && inc <= 1800) || (ppl > 1 && inc <= 1300);
  if (isHighestEligible && comprehensive && auditPerformed) {
    return 'highest';
  }

  // Podwyższony poziom dofinansowania (do 70%)
  const isIncreasedEligible = (ppl === 1 && inc <= 3150) || (ppl > 1 && inc <= 2250);
  if (isIncreasedEligible) {
    return 'increased';
  }

  // Podstawowy poziom dofinansowania (do 40%)
  // Roczny dochód wnioskodawcy nie przekracza 135 000 zł.
  const annualIncome = inc * 12 * (ppl > 1 ? 1 : ppl); // Dochód liczymy dla wnioskodawcy, nie całej rodziny
  if (annualIncome <= 135000) {
    return 'basic';
  }

  return 'none';
}


export function computeCategory(items, entries, level) {
  let factor = 0;
  if (level === 'highest') factor = 1.0;
  else if (level === 'increased') factor = 0.7;
  else if (level === 'basic') factor = 0.4;

  const rows = [];
  let net = 0;
  let vatSum = 0;
  let grantSum = 0;

  items.forEach(item => {
    const entry = entries[item.id] || {};
    const qty = parseDecimal(entry.quantity);
    const price = parseDecimal(entry.price);
    const rawVat = parseDecimal(entry.vat);
    let vatRate;

    if (rawVat) {
      vatRate = rawVat <= 1 ? rawVat : rawVat / 100;
    } else {
      const def = parseDecimal(item.vat);
      vatRate = def <= 1 ? def : def / 100;
    }

    if (!qty || !price) {
      return;
    }

    const costNet = qty * price;
    const grantPerUnit = item.max100 * factor;
    const maxGrant = qty * grantPerUnit;
    const grant = Math.min(costNet, maxGrant);
    const vatAmount = costNet * vatRate;
    const gross = costNet + vatAmount;
    const beneficiary = gross - grant;

    rows.push({
      name: item.name,
      quantity: qty,
      costNet,
      vatAmount,
      gross,
      grant,
      beneficiary,
    });

    net += costNet;
    vatSum += vatAmount;
    grantSum += grant;
  });

  const gross = net + vatSum;
  const beneficiaryTotal = gross - grantSum;
  return { rows, net, vat: vatSum, gross, grant: grantSum, beneficiary: beneficiaryTotal };
}