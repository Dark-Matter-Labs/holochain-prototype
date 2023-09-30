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
import { Clause } from '../types';

/**
 * @element clause-summary
 * @fires clause-selected: detail will contain { clauseHash }
 */
@localized()
@customElement('clause-summary')
export class ClauseSummary extends LitElement {
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

  renderSummary(entryRecord: EntryRecord<Clause>) {
    return html`
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
    `;
  }

  renderClause() {
    switch (this._clause.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._clause.value.value)
          return html`<span
            >${msg("The requested clause doesn't exist")}</span
          >`;

        return this.renderSummary(this._clause.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the clause')}
          .error=${this._clause.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('clause-selected', {
            composed: true,
            bubbles: true,
            detail: {
              clauseHash: this.clauseHash,
            },
          })
        )}
    >
      ${this.renderClause()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
