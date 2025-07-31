export const documentationItems = [
  // VAT rates are stored as percentages (e.g. 8 means 8 %).  They are
  // converted to decimal form during calculations.
  { id: 'audit', name: 'Audyt energetyczny', unit: 'szt', max100: 1200.0, vat: 8 },
  { id: 'certificate', name: 'Świadectwo charakterystyki energetycznej', unit: 'szt', max100: 400.0, vat: 8 }
];

export const heatItems = [
  { id: 'district', name: 'Podłączenie do sieci ciepłowniczej (z węzłem cieplnym)', unit: 'szt', max100: 22250.0, vat: 8 },
  { id: 'air_water_pump', name: 'Pompa ciepła powietrze/woda', unit: 'szt', max100: 31500.0, vat: 8 },
  { id: 'air_water_pump_high', name: 'Pompa ciepła powietrze/woda (wyższa klasa efektywności)', unit: 'szt', max100: 37500.0, vat: 8 },
  { id: 'air_air_pump', name: 'Pompa ciepła powietrze/powietrze', unit: 'szt', max100: 11200.0, vat: 8 },
  { id: 'ground_pump_high', name: 'Gruntowa pompa ciepła (wysoka klasa efektywności)', unit: 'szt', max100: 45000.0, vat: 8 },
  { id: 'ground_source', name: 'Dolne źródło gruntowej pompy ciepła', unit: 'szt', max100: 21500.0, vat: 8 },
  { id: 'wood_gas_boiler', name: 'Kocioł zgazowujący drewno (podwyższony standard)', unit: 'szt', max100: 20500.0, vat: 8 },
  { id: 'pellet_boiler', name: 'Kocioł na pellet drzewny (podwyższony standard)', unit: 'szt', max100: 20500.0, vat: 8 },
  { id: 'electric_heating', name: 'Ogrzewanie elektryczne', unit: 'szt', max100: 11200.0, vat: 8 },
  { id: 'central_heating', name: 'Instalacja centralnego ogrzewania + ciepła woda użytkowa', unit: 'szt', max100: 20500.0, vat: 8 }
];

export const thermoItems = [
  { id: 'roof_ceiling', name: 'Ocieplenie stropu/dachu', unit: 'm²', max100: 200.0, vat: 8 },
  { id: 'floors', name: 'Ocieplenie podłóg', unit: 'm²', max100: 150.0, vat: 8 },
  { id: 'walls', name: 'Ocieplenie ścian', unit: 'm²', max100: 250.0, vat: 8 },
  { id: 'windows', name: 'Stolarka okienna', unit: 'm²', max100: 1200.0, vat: 8 },
  { id: 'doors', name: 'Stolarka drzwiowa', unit: 'm²', max100: 2500.0, vat: 8 },
  { id: 'garage_doors', name: 'Bramy garażowe', unit: 'szt', max100: 2500.0, vat: 8 }
];

export const ventItems = [
  { id: 'central_rekuperation', name: 'Rekuperacja centralna', unit: 'kpl', max100: 16700.0, vat: 8 },
  { id: 'wall_rekuperator', name: 'Rekuperator ścienny', unit: 'szt', max100: 2000.0, vat: 8 }
];

// This list is now for informational purposes for the user.
export const energyOptions = [
  { value: 'low', label: 'do 70 kWh/(m²·rok)' },
  { value: 'mid', label: '70–140 kWh/(m²·rok)' },
  { value: 'high', label: 'powyżej 140 kWh/(m²·rok)' }
];