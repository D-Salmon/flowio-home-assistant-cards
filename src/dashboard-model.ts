import { configObject, normalizePrefix } from './entities';
import { normalizeMqttRoot } from './maintenance-mqtt';

export const DASHBOARD_TABS = [
  'overview',
  'filtration',
  'treatment',
  'equipment',
  'probes',
  'history',
  'alarms',
  'system'
] as const;

export type DashboardTab = typeof DASHBOARD_TABS[number];

export interface DashboardConfig {
  type: 'custom:flowio-dashboard-card';
  title: string;
  entity_prefix: string;
  tabs: DashboardTab[];
  default_tab: DashboardTab;
  mqtt_topic?: string;
  grid_options?: Record<string, unknown>;
}

export function normalizeDashboardConfig(input: unknown): DashboardConfig {
  const raw = configObject(input);
  const title = raw.title ?? 'Flow.io';
  if (typeof title !== 'string' || !title.trim()) throw new Error('Titre invalide');

  const suppliedTabs = raw.tabs ?? DASHBOARD_TABS;
  if (!Array.isArray(suppliedTabs) || suppliedTabs.length === 0 ||
      suppliedTabs.some(tab => !(DASHBOARD_TABS as readonly unknown[]).includes(tab))) {
    throw new Error('Choisir au moins un onglet proposé');
  }
  const tabs = [...new Set(suppliedTabs)] as DashboardTab[];

  const defaultTab = raw.default_tab ?? tabs[0];
  if (!(DASHBOARD_TABS as readonly unknown[]).includes(defaultTab) || !tabs.includes(defaultTab as DashboardTab)) {
    throw new Error('L’onglet initial doit être visible');
  }

  if (raw.mqtt_topic !== undefined && typeof raw.mqtt_topic !== 'string') {
    throw new Error('mqtt_topic doit être un texte');
  }
  const mqttTopic = typeof raw.mqtt_topic === 'string' && raw.mqtt_topic.trim()
    ? normalizeMqttRoot(raw.mqtt_topic)
    : undefined;

  const gridOptions = raw.grid_options === undefined ? undefined : configObject(raw.grid_options);

  return {
    type: 'custom:flowio-dashboard-card',
    title: title.trim(),
    entity_prefix: normalizePrefix(raw.entity_prefix),
    tabs,
    default_tab: defaultTab as DashboardTab,
    ...(mqttTopic ? { mqtt_topic: mqttTopic } : {}),
    ...(gridOptions ? { grid_options: gridOptions } : {})
  };
}

