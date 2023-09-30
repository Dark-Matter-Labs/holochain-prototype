import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { stewardshipStoreContext } from '../context';
import { StewardshipStore } from '../stewardship-store';
import { Actant } from '../types';

/**
 * @element actant-summary
 * @fires actant-selected: detail will contain { actantHash }
 */
@localized()
@customElement('actant-summary')
export class ActantSummary extends LitElement {
  // REQUIRED. The hash of the Actant to show
  @property(hashProperty('actant-hash'))
  actantHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  /**
   * @internal
   */
  _actant = new StoreSubscriber(this, () =>
    this.stewardshipStore.actants.get(this.actantHash)
  );

  renderSummary(entryRecord: EntryRecord<Actant>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <h2>${entryRecord.entry.name}</h2>

        ${entryRecord.entry.agents.map(
          el => html`<agent-avatar .agentPubKey=${el}></agent-avatar>`
        )}
      </div>
    `;
  }

  renderActant() {
    switch (this._actant.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._actant.value.value)
          return html`<span
            >${msg("The requested actant doesn't exist")}</span
          >`;

        return this.renderSummary(this._actant.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the actant')}
          .error=${this._actant.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('actant-selected', {
            composed: true,
            bubbles: true,
            detail: {
              actantHash: this.actantHash,
            },
          })
        )}
    >
      ${this.renderActant()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
