import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../examples/dashboard-flowio-3.5.1.yaml', import.meta.url), 'utf8');
const originalSource = readFileSync(new URL('../examples/dashboard-flowio-3.5.1-original.yaml', import.meta.url), 'utf8');
const expectedTitles = [
  'Piscine', 'Filtration', 'pH', 'Désinfection',
  'Oxygène', 'Équipements', 'Alarmes', 'Système'
];

describe('tableau de bord Flow.io 3.5.1', () => {
  it('fournit les huit vues Home Assistant attendues', () => {
    const titles = [...source.matchAll(/^  - title: (.+)$/gm)].map(match => match[1]);
    expect(titles).toEqual(expectedTitles);
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

describe('tableau de bord original Flow.io-Waveshare 3.5.1', () => {
  it('conserve exactement les huit vues attendues', () => {
    const titles = [...originalSource.matchAll(/^  - title: (.+)$/gm)].map(match => match[1]);
    expect(titles).toEqual(expectedTitles);
  });

  it('reste distinct du modèle basé sur les cartes HACS', () => {
    expect(originalSource).toContain('custom:mushroom-legacy-template-card');
    expect(originalSource).toContain('custom:mini-graph-card');
    expect(originalSource).toContain('custom:modern-circular-gauge');
    expect(originalSource).not.toContain('custom:flowio-pool-card');
    expect(originalSource).toContain('sensor.fio_');
  });
});
