import { StandardUnit } from '../types';

export const units: StandardUnit[] = [
  { name: "gramo", abbreviation: "g", type: "weight", system: "metric" },
  { name: "kilogramo", abbreviation: "kg", type: "weight", system: "metric" },
  { name: "onza", abbreviation: "oz", type: "weight", system: "imperial", grams: 28.35 },
  { name: "libra", abbreviation: "lb", type: "weight", system: "imperial", grams: 453.59 },
  { name: "mililitro", abbreviation: "ml", type: "volume", system: "metric" },
  { name: "litro", abbreviation: "l", type: "volume", system: "metric" },
  { name: "unidad", abbreviation: "u", type: "unit", system: "metric" }
];