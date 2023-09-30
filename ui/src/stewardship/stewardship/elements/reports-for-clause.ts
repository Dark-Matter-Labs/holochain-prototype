import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord, RecordBag } from '@holochain-open-dev/utils';
import { ActionHash, AgentPubKey, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Report } from '../types.js';
import './report-summary.js';

/**
 * @element reports-for-clause
 */
@localized()
@customElement('reports-for-clause')
export class ReportsForClause extends LitElement {
  // REQUIRED. The ClauseHash for which the Reports should be fetched
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
  _reports = new StoreSubscriber(this, () =>
    this.stewardshipStore.reportsForClause.get(this.clauseHash)
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder"
          >${msg('No reports found for this clause')}</span
        >
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(
          hash => html`<report-summary .reportHash=${hash}></report-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._reports.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderList(this._reports.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the reports')}
          .error=${this._reports.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
