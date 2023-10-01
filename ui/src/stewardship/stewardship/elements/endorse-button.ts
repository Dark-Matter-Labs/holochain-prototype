import {
  hashProperty,
  notifyError,
  sharedStyles,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber, toPromise } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Endorsement } from '../types.js';

/**
 * @element endorse-button
 * @fires endorsement-created: detail will contain { endorsementHash }
 */
@localized()
@customElement('endorse-button')
export class EndorseButton extends LitElement {
  // REQUIRED. The report hash for this Endorsement
  @property(hashProperty('report-hash'))
  reportHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  _existingEndorsementHashes = new StoreSubscriber(this, () =>
    this.stewardshipStore.endorsementsForReport.get(this.reportHash)
  );

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

  async createEndorsement() {
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

  async renderContentAsync(endorsementHashes: ActionHash[]) {
    const records = await Promise.all(
      endorsementHashes.map(hash =>
        toPromise(this.stewardshipStore.endorsements.get(hash))
      )
    );
    const myPubKey = this.stewardshipStore.client.client.myPubKey.toString();
    const userHasEndorsed = records.some(
      record => record?.action.author.toString() === myPubKey
    );
    return html`<h4>${records.length ?? 0} Endorsement(s)</h4>
      ${userHasEndorsed
        ? ''
        : html`<sl-button
            @click=${this.createEndorsement}
            .disable=${this.committing}
            >Endorse</sl-button
          >`}`;
  }

  render() {
    switch (this._existingEndorsementHashes.value.status) {
      case 'pending':
        return html`<span>Loading...</span>`;
      case 'complete':
        return until(
          this.renderContentAsync(this._existingEndorsementHashes.value.value)
        );
      case 'error':
        return html` <display-error
          .headline=${msg('Error fetching the endorsements for report')}
          .error=${this._existingEndorsementHashes.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
