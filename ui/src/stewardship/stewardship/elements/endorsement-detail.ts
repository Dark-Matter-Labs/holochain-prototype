import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from '@mdi/js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Endorsement } from '../types.js';

/**
 * @element endorsement-detail
 * @fires endorsement-deleted: detail will contain { endorsementHash }
 */
@localized()
@customElement('endorsement-detail')
export class EndorsementDetail extends LitElement {
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

  renderDetail(entryRecord: EntryRecord<Endorsement>) {
    return html`<sl-card>
      <div slot="header" style="display: flex; flex-direction: row">
        <span style="font-size: 18px; flex: 1;">${msg('Endorsement')}</span>
      </div>

      <div style="display: flex; flex-direction: column"></div>
    </sl-card> `;
  }

  render() {
    switch (this._endorsement.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const endorsement = this._endorsement.value.value;

        if (!endorsement)
          return html`<span
            >${msg("The requested endorsement doesn't exist")}</span
          >`;

        return this.renderDetail(endorsement);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the endorsement')}
            .error=${this._endorsement.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
