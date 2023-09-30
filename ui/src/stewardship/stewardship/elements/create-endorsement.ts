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
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Endorsement } from '../types.js';

/**
 * @element create-endorsement
 * @fires endorsement-created: detail will contain { endorsementHash }
 */
@localized()
@customElement('create-endorsement')
export class CreateEndorsement extends LitElement {
  // REQUIRED. The report hash for this Endorsement
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
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;

  async createEndorsement(fields: any) {
    if (this.reportHash === undefined)
      throw new Error(
        'Cannot create a new Endorsement without its report_hash field'
      );

    const endorsement: Endorsement = {
      report_hash: this.reportHash,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Endorsement> =
        await this.stewardshipStore.client.createEndorsement(endorsement);

      this.dispatchEvent(
        new CustomEvent('endorsement-created', {
          composed: true,
          bubbles: true,
          detail: {
            endorsementHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the endorsement'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Endorsement')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createEndorsement(fields))}
      >
        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Endorsement')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
