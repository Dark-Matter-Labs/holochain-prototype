import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import {
  AsyncStatus,
  StoreSubscriber,
  toPromise,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  DnaHash,
  EntryHash,
  Record,
  decodeHashFromBase64,
  encodeHashToBase64,
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
// import SlSelect from '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Actant, Clause } from '../types.js';

type HolderType = 'right-holders' | 'responsibility-holders';

/**
 * @element create-clause
 * @fires clause-created: detail will contain { clauseHash }
 */
@localized()
@customElement('create-clause')
export class CreateClause extends LitElement {
  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  /**
   * @internal
   */
  _allActants = new StoreSubscriber(
    this,
    () => this.stewardshipStore.allActants
  );

  // _storeSubscribers: {
  //   [hash: string]:
  //     | StoreSubscriber<AsyncStatus<EntryRecord<Actant> | undefined>>
  //     | undefined;
  // } = {};

  @state()
  selectedRightHolders: { [hash: string]: boolean } = {};

  @state()
  selectedResponsibilityHolders: { [hash: string]: boolean } = {};

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

  async createClause(fields: any) {
    const right_holders = Object.keys(this.selectedRightHolders).map(hashStr =>
      decodeHashFromBase64(hashStr)
    );
    const responsibilty_holders = Object.keys(
      this.selectedResponsibilityHolders
    ).map(hashStr => decodeHashFromBase64(hashStr));
    const clause: Clause = {
      title: fields.title,
      statement: fields.statement,
      right_holders,
      responsibilty_holders,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Clause> =
        await this.stewardshipStore.client.createClause(clause);

      this.dispatchEvent(
        new CustomEvent('clause-created', {
          composed: true,
          bubbles: true,
          detail: {
            clauseHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the clause'));
    }
    this.committing = false;
  }

  handleCheckboxChange(holderType: HolderType, hashStr: string) {
    switch (holderType) {
      case 'right-holders': {
        this.selectedRightHolders[hashStr] =
          !this.selectedRightHolders[hashStr];
        break;
      }
      case 'responsibility-holders': {
        this.selectedResponsibilityHolders[hashStr] =
          !this.selectedResponsibilityHolders[hashStr];
        break;
      }
    }
  }

  renderOption(holderType: HolderType, hash: ActionHash) {
    // TODO: !?!?!?
    // const optionProm = toPromise(this.stewardshipStore.actants.get(hash)).then(
    //   actantRecord =>
    //     html`<sl-option value=${encodeHashToBase64(hash)}
    //       >${actantRecord?.entry.name}</sl-option
    //     >`
    // );
    // return html`${until(
    //   optionProm,
    //   html`<sl-option value=${encodeHashToBase64(hash)}>Loading...</sl-option>`
    // )}`;
    const checkbox = toPromise(this.stewardshipStore.actants.get(hash)).then(
      actantRecord => {
        const hashStr = encodeHashToBase64(hash);
        const id = `${holderType}-${hash}`;
        console.log('checked', this.selectedRightHolders[hashStr]);
        return html`<input
            type="checkbox"
            id=${id}
            name=${actantRecord?.entry.name}
            ${this.selectedRightHolders[hashStr] ? `checked` : ''}
            @change=${() => this.handleCheckboxChange(holderType, hashStr)}
          />
          <label for=${id}>${actantRecord?.entry.name}</label><br />`;
      }
    );
    return html`${until(checkbox, html`<span>Loading...</span>`)}`;
  }

  renderActantSelect(holderType: HolderType) {
    console.log(this._allActants.value.status);
    switch (this._allActants.value.status) {
      case 'pending':
        return html`<span>loading...</span>`;
      case 'complete': {
        const actantHahses = this._allActants.value.value;
        const options = actantHahses.map(hash =>
          this.renderOption(holderType, hash)
        );
        return options;
        // TODO: why doesn't this work!?
        // return html` <sl-select
        //   id="right-holders"
        //   name="Right holders"
        //   .label=${msg('Right Holders')}
        //   required
        //   @sl-change=${this.handleChange}
        // >
        //   ${options}
        // </sl-select>`;
      }
    }
    // this._allActants.value.status
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Clause')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createClause(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-input name="title" .label=${msg('Title')} required></sl-input>
        </div>
        <div style="margin-bottom: 16px;">
          <sl-textarea
            name="statement"
            .label=${msg('Statement')}
            required
          ></sl-textarea>
        </div>
        <div style="margin-bottom: 16px;">
          <h4>Right Holders</h4>
          ${this.renderActantSelect('right-holders')}
        </div>
        <div style="margin-bottom: 16px;">
          <h4>Responsibility Holders</h4>
          ${this.renderActantSelect('responsibility-holders')}
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Clause')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
