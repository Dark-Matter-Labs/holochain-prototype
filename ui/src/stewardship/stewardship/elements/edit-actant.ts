import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/profiles/dist/elements/search-agent.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, AgentPubKey, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stewardshipStoreContext } from '../context';
import { StewardshipStore } from '../stewardship-store';
import { Actant } from '../types';

/**
 * @element edit-actant
 * @fires actant-updated: detail will contain { originalActantHash, previousActantHash, updatedActantHash }
 */
@localized()
@customElement('edit-actant')
export class EditActant extends LitElement {
  // REQUIRED. The hash of the original `Create` action for this Actant
  @property(hashProperty('original-actant-hash'))
  originalActantHash!: ActionHash;

  // REQUIRED. The current Actant record that should be updated
  @property()
  currentRecord!: EntryRecord<Actant>;

  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext })
  stewardshipStore!: StewardshipStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @state()
  _agentsFields = this.currentRecord.entry.agents.map((_, index) => index);

  firstUpdated() {
    this.shadowRoot?.querySelector('form')!.reset();
  }

  async updateActant(fields: any) {
    const actant: Actant = {
      agents: (Array.isArray(fields.agents)
        ? fields.agents
        : [fields.agents]
      ).map((el: any) => el),
      name: fields.name,
    };

    try {
      this.committing = true;
      const updateRecord = await this.stewardshipStore.client.updateActant(
        this.originalActantHash,
        this.currentRecord.actionHash,
        actant
      );

      this.dispatchEvent(
        new CustomEvent('actant-updated', {
          composed: true,
          bubbles: true,
          detail: {
            originalActantHash: this.originalActantHash,
            previousActantHash: this.currentRecord.actionHash,
            updatedActantHash: updateRecord.actionHash,
          },
        })
      );
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error updating the actant'));
    }

    this.committing = false;
  }

  render() {
    return html` <sl-card>
      <span slot="header">${msg('Edit Actant')}</span>

      <form
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.updateActant(fields))}
      >
        <div style="margin-bottom: 16px">
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
                    .defaultValue=${this.currentRecord.entry.agents[index]}
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

        <div style="margin-bottom: 16px">
          <sl-input
            name="name"
            .label=${msg('Name')}
            required
            .defaultValue=${this.currentRecord.entry.name}
          ></sl-input>
        </div>

        <div style="display: flex; flex-direction: row">
          <sl-button
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('edit-canceled', {
                  bubbles: true,
                  composed: true,
                })
              )}
            style="flex: 1;"
            >${msg('Cancel')}</sl-button
          >
          <sl-button
            type="submit"
            variant="primary"
            style="flex: 1;"
            .loading=${this.committing}
            >${msg('Save')}</sl-button
          >
        </div>
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
