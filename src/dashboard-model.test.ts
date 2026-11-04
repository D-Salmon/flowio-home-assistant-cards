import { describe, expect, it } from 'vitest';
import { DASHBOARD_TABS, normalizeDashboardConfig } from './dashboard-model';

describe('configuration du tableau de bord Flow.io', () => {
  it('conserve fio et tous les onglets par défaut', () => {
    const config = normalizeDashboardConfig({});
    expect(config.entity_prefix).toBe('fio');
    expect(config.tabs).toEqual(DASHBOARD_TABS);
    expect(config.default_tab).toBe('overview');
  });

  it('applique un préfixe indépendant pour une seconde piscine', () => {
    const config = normalizeDashboardConfig({
      title: 'Piscine secondaire',
      entity_prefix: 'bassin2_',
      tabs: ['overview', 'filtration', 'history'],
      default_tab: 'history',
      mqtt_topic: ' pool/bassin2/ '
    });
    expect(config).toMatchObject({
      title: 'Piscine secondaire',
      entity_prefix: 'bassin2',
      tabs: ['overview', 'filtration', 'history'],
      default_tab: 'history',
      mqtt_topic: 'pool/bassin2'
    });
  });

  it('refuse un onglet initial masqué', () => {
    expect(() => normalizeDashboardConfig({ tabs: ['overview'], default_tab: 'system' }))
      .toThrow('L’onglet initial doit être visible');
  });
});

