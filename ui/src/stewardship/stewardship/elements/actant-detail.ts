import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
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
import { Actant } from '../types.js';
import './edit-actant.js';

/**
 * @element actant-detail
 * @fires actant-deleted: detail will contain { actantHash }
 */
@localized()
@customElement('actant-detail')
export class ActantDetail extends LitElement {
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

  /**
   * @internal
   */
  @state()
  _editing = false;

  async deleteActant() {
    try {
      await this.stewardshipStore.client.deleteActant(this.actantHash);

      this.dispatchEvent(
        new CustomEvent('actant-deleted', {
          bubbles: true,
          composed: true,
          detail: {
            actantHash: this.actantHash,
          },
        })
      );
    } catch (e: any) {
      notifyError(msg('Error deleting the actant'));
      console.error(e);
    }
  }

  renderDetail(entryRecord: EntryRecord<Actant>) {
    return html`<sl-card>
      <div slot="header" style="display: flex; flex-direction: row">
        <span style="font-size: 18px; flex: 1;">${msg('Actant')}</span>

        <sl-icon-button
          style="margin-left: 8px"
          .src=${wrapPathInSvg(mdiPencil)}
          @click=${() => {
            this._editing = true;
          }}
        ></sl-icon-button>
        <sl-icon-button
          style="margin-left: 8px"
          .src=${wrapPathInSvg(mdiDelete)}
          @click=${() => this.deleteActant()}
        ></sl-icon-button>
      </div>

      <div style="display: flex; flex-direction: column">
        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Agents')}</strong></span
          >
          ${entryRecord.entry.agents.map(
            el =>
              html`<span style="white-space: pre-line"
                ><agent-avatar .agentPubKey=${el}></agent-avatar
              ></span>`
          )}
        </div>

        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Name')}</strong></span
          >
          <span style="white-space: pre-line">${entryRecord.entry.name}</span>
        </div>
      </div>
    </sl-card> `;
  }

  render() {
    switch (this._actant.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const actant = this._actant.value.value;

        if (!actant)
          return html`<span
            >${msg("The requested actant doesn't exist")}</span
          >`;

        if (this._editing) {
          return html`<edit-actant
            .originalActantHash=${this.actantHash}
            .currentRecord=${actant}
            @actant-updated=${async () => {
              this._editing = false;
            }}
            @edit-canceled=${() => {
              this._editing = false;
            }}
            style="display: flex; flex: 1;"
          ></edit-actant>`;
        }

        return this.renderDetail(actant);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the actant')}
            .error=${this._actant.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
