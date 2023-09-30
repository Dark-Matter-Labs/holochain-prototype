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
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Clause } from '../types.js';

/**
 * @element create-clause
 * @fires clause-created: detail will contain { clauseHash }
 */
@localized()
@customElement('create-clause')
export class CreateClause extends LitElement {
  // REQUIRED. The right holders for this Clause
  @property()
  rightHolders!: Array<ActionHash>;

  // REQUIRED. The responsibilty holders for this Clause
  @property()
  responsibiltyHolders!: Array<ActionHash>;

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

  async createClause(fields: any) {
    if (this.rightHolders === undefined)
      throw new Error(
        'Cannot create a new Clause without its right_holders field'
      );
    if (this.responsibiltyHolders === undefined)
      throw new Error(
        'Cannot create a new Clause without its responsibilty_holders field'
      );

    const clause: Clause = {
      statement: fields.statement,
      right_holders: this.rightHolders,
      responsibilty_holders: this.responsibiltyHolders,
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

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Clause')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createClause(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-textarea
            name="statement"
            .label=${msg('Statement')}
            required
          ></sl-textarea>
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Clause')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
