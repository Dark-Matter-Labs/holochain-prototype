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
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Clause } from '../types.js';

/**
 * @element clause-detail
 * @fires clause-deleted: detail will contain { clauseHash }
 */
@localized()
@customElement('clause-detail')
export class ClauseDetail extends LitElement {
  // REQUIRED. The hash of the Clause to show
  @property(hashProperty('clause-hash'))
  clauseHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  /**
   * @internal
   */
  _clause = new StoreSubscriber(this, () =>
    this.stewardshipStore.clauses.get(this.clauseHash)
  );

  async deleteClause() {
    try {
      await this.stewardshipStore.client.deleteClause(this.clauseHash);

      this.dispatchEvent(
        new CustomEvent('clause-deleted', {
          bubbles: true,
          composed: true,
          detail: {
            clauseHash: this.clauseHash,
          },
        })
      );
    } catch (e: any) {
      notifyError(msg('Error deleting the clause'));
      console.error(e);
    }
  }

  renderDetail(entryRecord: EntryRecord<Clause>) {
    return html`<sl-card>
      <div slot="header" style="display: flex; flex-direction: row">
        <span style="font-size: 18px; flex: 1;">${msg('Clause')}</span>

        <sl-icon-button
          style="margin-left: 8px"
          .src=${wrapPathInSvg(mdiDelete)}
          @click=${() => this.deleteClause()}
        ></sl-icon-button>
      </div>

      <div style="display: flex; flex-direction: column">
        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Statement')}</strong></span
          >
          <span style="white-space: pre-line"
            >${entryRecord.entry.statement}</span
          >
        </div>
      </div>
    </sl-card> `;
  }

  render() {
    switch (this._clause.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const clause = this._clause.value.value;

        if (!clause)
          return html`<span
            >${msg("The requested clause doesn't exist")}</span
          >`;

        return this.renderDetail(clause);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the clause')}
            .error=${this._clause.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
