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
import { Report } from '../types.js';

/**
 * @element report-detail
 * @fires report-deleted: detail will contain { reportHash }
 */
@localized()
@customElement('report-detail')
export class ReportDetail extends LitElement {
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

  renderDetail(entryRecord: EntryRecord<Report>) {
    return html`<sl-card>
      <div slot="header" style="display: flex; flex-direction: row">
        <span style="font-size: 18px; flex: 1;">${msg('Report')}</span>
      </div>

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
    </sl-card> `;
  }

  render() {
    switch (this._report.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const report = this._report.value.value;

        if (!report)
          return html`<span
            >${msg("The requested report doesn't exist")}</span
          >`;

        return this.renderDetail(report);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the report')}
            .error=${this._report.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
