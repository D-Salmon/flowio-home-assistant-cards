import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../examples/dashboard-flowio-3.5.1.yaml', import.meta.url), 'utf8');

describe('tableau de bord Flow.io 3.5.1', () => {
  it('fournit les huit vues Home Assistant attendues', () => {
    const titles = [...source.matchAll(/^  - title: (.+)$/gm)].map(match => match[1]);
    expect(titles).toEqual([
      'Piscine', 'Filtration', 'pH', 'Désinfection',
      'Oxygène', 'Équipements', 'Alarmes', 'Système'
    ]);
  });

  it('utilise uniquement les cartes individuelles', () => {
    expect(source).not.toContain('custom:flowio-dashboard-card');
    for (const type of [
      'custom:flowio-pool-card',
      'custom:flowio-filtration-card',
      'custom:flowio-treatment-card',
      'custom:flowio-history-card',
      'custom:flowio-alarms-card',
      'custom:flowio-status-card'
    ]) expect(source).toContain(type);
  });

  it('rend le préfixe identifiable dans toutes les cartes', () => {
    const prefixes = source.match(/^\s+entity_prefix: fio$/gm) ?? [];
    expect(prefixes.length).toBeGreaterThanOrEqual(8);
  });

  it('conserve des chemins de vue uniques', () => {
    const paths = [...source.matchAll(/^    path: (.+)$/gm)].map(match => match[1]);
    expect(new Set(paths).size).toBe(8);
  });
});
