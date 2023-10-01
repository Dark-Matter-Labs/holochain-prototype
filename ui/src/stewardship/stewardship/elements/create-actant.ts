import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/search-agent.js';
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
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Actant } from '../types.js';


/**
 * @element create-actant
 * @fires actant-created: detail will contain { actantHash }
 */
@localized()
@customElement('create-actant')
export class CreateActant extends LitElement {
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

  /**
   * @internal
   */
  @state()
  _agentsFields = [0];

  async createActant(fields: any) {
    const actant: Actant = {
      agents: (Array.isArray(fields.agents)
        ? fields.agents
        : [fields.agents]
      ).map((el: any) => el),
      name: fields.name,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Actant> =
        await this.stewardshipStore.client.createActant(actant);

      this.dispatchEvent(
        new CustomEvent('actant-created', {
          composed: true,
          bubbles: true,
          detail: {
            actantHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the actant'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Actant')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createActant(fields))}
      >
        <div style="margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column">
            <span>${msg('Agents')}</span>

            ${repeat(
              this._agentsFields,
              i => i,
              index =>
                html`<div
                  class="row"
                  style="align-items: center; margin-top: 8px"
                >
                  <search-agent
                    name="agents"
                    .fieldLabel=${msg('')}
                  ></search-agent>
                  <sl-icon-button
                    .src=${wrapPathInSvg(mdiDelete)}
                    @click=${() => {
                      this._agentsFields = this._agentsFields.filter(
                        i => i !== index
                      );
                    }}
                  ></sl-icon-button>
                </div>`
            )}
            <sl-button
              style="margin-top: 8px"
              @click=${() => {
                this._agentsFields = [
                  ...this._agentsFields,
                  Math.max(...this._agentsFields) + 1,
                ];
              }}
              >${msg('Add Agents')}</sl-button
            >
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <sl-input name="name" .label=${msg('Name')} required></sl-input>
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Actant')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
