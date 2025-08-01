// src/data/programData.js

export const documentationItems = [
  { id: 'audit', name: 'Audyt energetyczny', unit: 'szt', max100: 1200, vat: 8 },
  { id: 'certificate', name: 'Świadectwo charakterystyki energetycznej', unit: 'szt', max100: 300, vat: 8 },
];

export const heatItems = [
  { id: 'district', name: 'Podłączenie do sieci ciepłowniczej z węzłem cieplnym', unit: 'szt', max100: 15500, vat: 8 },
  { id: 'air_water_pump', name: 'Pompa ciepła powietrze/woda', unit: 'szt', max100: 28000, vat: 8 },
  { id: 'air_water_pump_high', name: 'Pompa ciepła p/w o podwyższonej efektywności', unit: 'szt', max100: 35200, vat: 8 },
  { id: 'air_air_pump', name: 'Pompa ciepła powietrze/powietrze', unit: 'szt', max100: 11100, vat: 8 },
  { id: 'ground_pump_high', name: 'Gruntowa pompa ciepła o podwyższonej efektywności', unit: 'szt', max100: 50900, vat: 8 },
  { id: 'wood_gas_boiler', name: 'Kocioł zgazowujący drewno o podwyższonym standardzie', unit: 'szt', max100: 20400, vat: 8 },
  { id: 'pellet_boiler', name: 'Kocioł na pellet o podwyższonym standardzie', unit: 'szt', max100: 20400, vat: 8 },
  { id: 'electric_heating', name: 'Ogrzewanie elektryczne', unit: 'szt', max100: 13900, vat: 8 },
  { id: 'central_heating', name: 'Instalacja c.o. oraz c.w.u.', unit: 'szt', max100: 20400, vat: 8 }
];

export const thermoItems = [
  { id: 'walls', name: 'Ocieplenie przegród budowlanych', unit: 'm²', max100: 200, vat: 8 },
  { id: 'windows', name: 'Stolarka okienna', unit: 'm²', max100: 1200, vat: 8 },
  { id: 'doors', name: 'Stolarka drzwiowa', unit: 'm²', max100: 2500, vat: 8 },
  { id: 'garage_doors', name: 'Bramy garażowe', unit: 'szt', max100: 4600, vat: 8 }
];

// DODANO REKUPERATORY ŚCIENNE JAKO OSOBNĄ POZYCJĘ
export const ventItems = [
  { id: 'rekuperation_central', name: 'Wentylacja mechaniczna z odzyskiem ciepła (centrala)', unit: 'kpl', max100: 16700, vat: 8 },
  { id: 'rekuperation_wall', name: 'Wentylacja mechaniczna z odzyskiem ciepła (rekuperatory ścienne)', unit: 'szt', max100: 2000, vat: 8 },
];

export const energyOptions = [
  { value: 'low', label: 'do 70 kWh/(m²·rok)' },
  { value: 'mid', label: '70–140 kWh/(m²·rok)' },
  { value: 'high', label: 'powyżej 140 kWh/(m²·rok)' }
];