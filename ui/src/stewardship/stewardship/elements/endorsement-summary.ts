import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
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
import { Endorsement } from '../types';

/**
 * @element endorsement-summary
 * @fires endorsement-selected: detail will contain { endorsementHash }
 */
@localized()
@customElement('endorsement-summary')
export class EndorsementSummary extends LitElement {
  // REQUIRED. The hash of the Endorsement to show
  @property(hashProperty('endorsement-hash'))
  endorsementHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  /**
   * @internal
   */
  _endorsement = new StoreSubscriber(this, () =>
    this.stewardshipStore.endorsements.get(this.endorsementHash)
  );

  renderSummary(entryRecord: EntryRecord<Endorsement>) {
    return html` <div style="display: flex; flex-direction: column"></div> `;
  }

  renderEndorsement() {
    switch (this._endorsement.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._endorsement.value.value)
          return html`<span
            >${msg("The requested endorsement doesn't exist")}</span
          >`;

        return this.renderSummary(this._endorsement.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the endorsement')}
          .error=${this._endorsement.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('endorsement-selected', {
            composed: true,
            bubbles: true,
            detail: {
              endorsementHash: this.endorsementHash,
            },
          })
        )}
    >
      ${this.renderEndorsement()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
