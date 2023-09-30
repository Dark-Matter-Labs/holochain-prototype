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
import { Report } from '../types';

/**
 * @element report-summary
 * @fires report-selected: detail will contain { reportHash }
 */
@localized()
@customElement('report-summary')
export class ReportSummary extends LitElement {
  // REQUIRED. The hash of the Report to show
  @property(hashProperty('report-hash'))
  reportHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  /**
   * @internal
   */
  _report = new StoreSubscriber(this, () =>
    this.stewardshipStore.reports.get(this.reportHash)
  );

  renderSummary(entryRecord: EntryRecord<Report>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Report Type')}</strong></span
          >
          <span style="white-space: pre-line"
            >${entryRecord.entry.report_type}</span
          >
        </div>

        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Content')}</strong></span
          >
          <span style="white-space: pre-line"
            >${entryRecord.entry.content}</span
          >
        </div>
      </div>
    `;
  }

  renderReport() {
    switch (this._report.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._report.value.value)
          return html`<span
            >${msg("The requested report doesn't exist")}</span
          >`;

        return this.renderSummary(this._report.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the report')}
          .error=${this._report.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('report-selected', {
            composed: true,
            bubbles: true,
            detail: {
              reportHash: this.reportHash,
            },
          })
        )}
    >
      ${this.renderReport()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
