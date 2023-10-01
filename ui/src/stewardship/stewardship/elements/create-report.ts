import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  DnaHash,
  EntryHash,
  Record,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Report } from '../types.js';
import './actant-select.js';
import { ActantSelect } from './actant-select.js';

/**
 * @element create-report
 * @fires report-created: detail will contain { reportHash }
 */
@localized()
@customElement('create-report')
export class CreateReport extends LitElement {

  // REQUIRED. The clause hash for this Report
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
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;

  @query('#actant-select')
  actantSelect!: ActantSelect;


  async createReport(fields: any) {
    if (this.clauseHash === undefined)
      throw new Error(
        'Cannot create a new Report without its clause_hash field'
      );
    const actantHash = this.actantSelect.getValue()
    console.log("ACA", actantHash)
    if (!actantHash) {
      console.log("no actant!")
      return
    }
    const report: Report = {
      report_type: fields.report_type,
      content: fields.content,
      actant_hash: actantHash,
      clause_hash: this.clauseHash,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Report> =
        await this.stewardshipStore.client.createReport(report);

      this.dispatchEvent(
        new CustomEvent('report-created', {
          composed: true,
          bubbles: true,
          detail: {
            reportHash: record.actionHash,
          },
        })
      );

      this.form.reset();
      this.actantSelect.reset()
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the report'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Report')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createReport(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-input
            name="report_type"
            .label=${msg('Report Type')}
            required
          ></sl-input>
        </div>

        <div style="margin-bottom: 16px;">
          <sl-textarea
            name="content"
            .label=${msg('Content')}
            required
          ></sl-textarea>
        </div>

        <div style="margin-bottom: 16px;">
          <actant-select
            id="actant-select"
            name="actant"
          ></actant-select>
        </div>        

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Report')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
