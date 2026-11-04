import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { normalizeDashboardConfig, type DashboardConfig, type DashboardTab } from './dashboard-model';
import { overrideDevices } from './override-model';
import type { Hass } from './model';

type ChildCard = HTMLElement & { hass?: Hass; setConfig: (config: Record<string, unknown>) => void };

const TAB_PRESENTATION: Record<DashboardTab, { label: string; icon: string }> = {
  overview: { label: 'Piscine', icon: 'mdi:pool' },
  filtration: { label: 'Filtration', icon: 'mdi:filter-variant' },
  treatment: { label: 'Traitement', icon: 'mdi:flask-outline' },
  equipment: { label: 'Équipements', icon: 'mdi:toggle-switch-outline' },
  probes: { label: 'Sondes', icon: 'mdi:gauge' },
  history: { label: 'Graphiques', icon: 'mdi:chart-line' },
  alarms: { label: 'Alarmes', icon: 'mdi:bell-outline' },
  system: { label: 'Système', icon: 'mdi:chip' }
};

function entity(prefix: string, domain: string, suffix: string): string {
  return `${domain}.${prefix ? `${prefix}_` : ''}${suffix}`;
}

class FlowioDashboardCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    config: { state: true },
    activeTab: { state: true }
  };

  declare hass?: Hass;
  private config?: DashboardConfig;
  private activeTab: DashboardTab = 'overview';
  private mountedKey = '';
  private mountedCards: ChildCard[] = [];

  static getConfigElement() { return document.createElement('flowio-dashboard-card-editor'); }
  static getStubConfig(): DashboardConfig {
    return { ...normalizeDashboardConfig({}), grid_options: { columns: 'full' } };
  }

  setConfig(input: unknown) {
    const previousPrefix = this.config?.entity_prefix;
    this.config = normalizeDashboardConfig(input);
    if (!this.config.tabs.includes(this.activeTab) || previousPrefix !== this.config.entity_prefix) {
      this.activeTab = this.config.default_tab;
    }
    this.mountedKey = '';
  }

  getCardSize() { return 12; }

  protected updated(changed: PropertyValues) {
    const config = this.config;
    if (!config) return;
    const key = JSON.stringify({
      activeTab: this.activeTab,
      entityPrefix: config.entity_prefix,
      mqttTopic: config.mqtt_topic,
      overrideDevice: this.activeTab === 'filtration' ? overrideDevices(this.hass, config.entity_prefix)[0] ?? '' : ''
    });
    if (key !== this.mountedKey || changed.has('config')) {
      this.mountedCards = this.buildCards(this.activeTab, config);
      this.mountedKey = key;
      this.mountCards();
    } else if (changed.has('hass')) {
      for (const card of this.mountedCards) card.hass = this.hass;
    }
  }

  private createCard(tag: string, config: Record<string, unknown>): ChildCard {
    const card = document.createElement(tag) as ChildCard;
    card.setConfig(config);
    card.hass = this.hass;
    return card;
  }

  private buildCards(tab: DashboardTab, config: DashboardConfig): ChildCard[] {
    const prefix = config.entity_prefix;
    switch (tab) {
      case 'overview':
        return [this.createCard('flowio-pool-card', {
          title: 'Supervision',
          entity_prefix: prefix,
          ...(config.mqtt_topic ? { mqtt_topic: config.mqtt_topic } : {})
        })];
      case 'filtration':
        return [
          this.createCard('flowio-filtration-card', { entity_prefix: prefix }),
          this.createCard('flowio-override-card', {
            entity_prefix: prefix,
            device: overrideDevices(this.hass, prefix)[0] ?? ''
          })
        ];
      case 'treatment':
        return [this.createCard('flowio-treatment-card', { entity_prefix: prefix })];
      case 'equipment':
        return [
          this.createCard('flowio-equipment-card', {
            entity_prefix: prefix,
            columns: 2,
            entities: [
              'io_flt_pmp', 'io_ph_pmp', 'io_chl_pmp', 'io_chl_gen',
              'io_robot', 'io_fill_pmp', 'io_lights', 'io_wat_htr'
            ].map(suffix => entity(prefix, 'switch', suffix))
          }),
          this.createCard('flowio-modes-card', {
            entity_prefix: prefix,
            columns: 2,
            entities: [
              entity(prefix, 'switch', 'pl_modes_auto'),
              entity(prefix, 'switch', 'pl_modes_winter'),
              entity(prefix, 'switch', 'pl_ph_auto_mode'),
              entity(prefix, 'switch', 'pl_dis_auto'),
              entity(prefix, 'switch', 'pl_heat_auto'),
              entity(prefix, 'select', 'pl_modes_dis')
            ]
          })
        ];
      case 'probes':
        return [this.createCard('flowio-probes-card', {
          entity_prefix: prefix,
          columns: 2,
          entities: ['io_wat_tmp', 'io_air_tmp', 'io_ph', 'io_orp', 'io_psi']
            .map(suffix => entity(prefix, 'sensor', suffix))
        })];
      case 'history':
        return [this.createCard('flowio-history-card', {
          entity_prefix: prefix,
          title: 'Historique de la piscine',
          hours_to_show: 24
        })];
      case 'alarms':
        return [this.createCard('flowio-alarms-card', { entity_prefix: prefix })];
      case 'system':
        return [this.createCard('flowio-status-card', {
          entity_prefix: prefix,
          items: [
            'wifi_ip', 'wifi_mac', 'wifi_rssi', 'sys_upt_mn',
            'sys_hp_free', 'sys_hp_min_free', 'sys_hp_frag', 'voltage', 'current'
          ]
        })];
    }
  }

  private mountCards() {
    const content = this.renderRoot.querySelector<HTMLElement>('.content');
    if (!content) return;
    content.replaceChildren(...this.mountedCards);
  }

  private selectTab(tab: DashboardTab) {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    this.mountedKey = '';
  }

  render() {
    const config = this.config;
    if (!config) return nothing;
    return html`<ha-card>
      <header>
        <div class=heading>
          <ha-icon icon=mdi:pool></ha-icon>
          <div><h2>${config.title}</h2><p>Préfixe Home Assistant · ${config.entity_prefix || 'aucun'}</p></div>
        </div>
        <nav role=tablist aria-label="Navigation Flow.io">
          ${config.tabs.map(tab => html`<button
            type=button
            role=tab
            aria-selected=${this.activeTab === tab ? 'true' : 'false'}
            data-active=${this.activeTab === tab ? 'true' : 'false'}
            @click=${() => this.selectTab(tab)}>
            <ha-icon icon=${TAB_PRESENTATION[tab].icon}></ha-icon>
            <span>${TAB_PRESENTATION[tab].label}</span>
          </button>`)}
        </nav>
      </header>
      <main class=content role=tabpanel></main>
    </ha-card>`;
  }

  static styles = css`
    :host{display:block;container-type:inline-size;color:var(--primary-text-color);font-family:var(--ha-font-family-body,inherit)}
    ha-card{overflow:hidden;background:transparent;box-shadow:none;border:0}
    header{margin-bottom:16px;border:1px solid var(--divider-color);border-radius:20px;background:var(--card-background-color);overflow:hidden}
    .heading{display:flex;align-items:center;gap:14px;padding:18px 20px 12px}
    .heading>ha-icon{--mdc-icon-size:32px;color:var(--primary-color)}
    h2{margin:0;font-size:1.35rem;line-height:1.25}
    p{margin:3px 0 0;color:var(--secondary-text-color);font-size:.78rem}
    nav{display:flex;gap:4px;padding:4px 10px 10px;overflow-x:auto;scrollbar-width:thin}
    button{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;min-height:44px;padding:8px 13px;border:0;border-radius:13px;background:transparent;color:var(--secondary-text-color);font:inherit;font-size:.8rem;font-weight:600;cursor:pointer}
    button:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}
    button[data-active=true]{background:color-mix(in srgb,var(--primary-color) 14%,var(--card-background-color));color:var(--primary-color)}
    button ha-icon{--mdc-icon-size:20px}
    .content{display:grid;gap:16px;min-width:0}
    .content>*{display:block;min-width:0}
    @container(max-width:600px){
      .heading{padding:14px 14px 9px}
      .heading>ha-icon{--mdc-icon-size:27px}
      h2{font-size:1.15rem}
      nav{padding-inline:7px}
      button{padding-inline:10px}
    }
  `;
}

class FlowioDashboardCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true }, error: { state: true } };
  declare hass?: Hass;
  private config?: DashboardConfig;
  private error = '';

  setConfig(input: unknown) {
    this.config = normalizeDashboardConfig(input);
    this.error = '';
  }

  private changed(event: CustomEvent) {
    event.stopPropagation();
    try {
      this.config = normalizeDashboardConfig(event.detail.value);
      this.error = '';
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this.config },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Configuration invalide';
    }
  }

  render() {
    if (!this.config || !this.hass) return nothing;
    const tabOptions = this.config.tabs.map(tab => ({ value: tab, label: TAB_PRESENTATION[tab].label }));
    const schema = [
      { name: 'title', selector: { text: {} } },
      { name: 'entity_prefix', selector: { text: {} } },
      { name: 'mqtt_topic', selector: { text: {} } },
      { name: 'tabs', selector: { select: { multiple: true, mode: 'list', options: Object.entries(TAB_PRESENTATION).map(([value, item]) => ({ value, label: item.label })) } } },
      { name: 'default_tab', selector: { select: { mode: 'dropdown', options: tabOptions } } }
    ];
    const labels: Record<string, string> = {
      title: 'Titre',
      entity_prefix: 'Préfixe firmware',
      mqtt_topic: 'Topic racine MQTT (facultatif)',
      tabs: 'Onglets visibles',
      default_tab: 'Onglet initial'
    };
    return html`<p>Utiliser le même préfixe que dans la configuration Home Assistant du contrôleur Flow.io.</p>
      ${this.error ? html`<p role=alert>${this.error}</p>` : nothing}
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${schema}
        .computeLabel=${(field: { name: string }) => labels[field.name] ?? field.name}
        @value-changed=${this.changed}></ha-form>`;
  }

  static styles = css`
    :host{display:block}
    p{color:var(--secondary-text-color);line-height:1.5}
    p[role=alert]{color:var(--error-color)}
  `;
}

if (!customElements.get('flowio-dashboard-card')) customElements.define('flowio-dashboard-card', FlowioDashboardCard);
if (!customElements.get('flowio-dashboard-card-editor')) customElements.define('flowio-dashboard-card-editor', FlowioDashboardCardEditor);

const registry = window as Window & { customCards?: Array<Record<string, unknown>> };
registry.customCards ??= [];
if (!registry.customCards.some(card => card.type === 'flowio-dashboard-card')) {
  registry.customCards.push({
    type: 'flowio-dashboard-card',
    name: 'Flow.io Tableau de bord',
    description: 'Tableau de bord complet avec navigation et préfixe commun.',
    preview: true
  });
}

