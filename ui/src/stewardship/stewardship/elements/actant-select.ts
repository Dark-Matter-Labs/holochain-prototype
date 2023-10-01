import {
    hashProperty,
    notifyError,
    sharedStyles,
    wrapPathInSvg,
  } from '@holochain-open-dev/elements';
  import '@holochain-open-dev/elements/dist/elements/display-error.js';
  import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
  import { StoreSubscriber, toPromise } from '@holochain-open-dev/stores';
  import { EntryRecord } from '@holochain-open-dev/utils';
  import { ActionHash, EntryHash, Record, encodeHashToBase64, decodeHashFromBase64 } from '@holochain/client';
  import { consume } from '@lit-labs/context';
  import { localized, msg } from '@lit/localize';
  import { LitElement, html } from 'lit';
  import { customElement, property, state } from 'lit/decorators.js';
  
  import { stewardshipStoreContext } from '../context.js';
  import { StewardshipStore } from '../stewardship-store.js';
  import { Actant } from '../types.js';
  import './edit-actant.js';
import { until } from 'lit/directives/until.js';
  
  /**
 * @element actant-select
 */
@localized()
@customElement('actant-select')
export class ActantSelect extends LitElement {
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

    @state()
    selectedActants: { [hash: string]: boolean } = {};

    getValue() {
        if (Object.keys(this.selectedActants).length > 0) {
            for (const key of Object.keys(this.selectedActants)) {
                const val = this.selectedActants[key]
                if (val) {
                    return decodeHashFromBase64(key)
                }
            }
        }
        return undefined
    }

    reset() {
        this.selectedActants = {}
    }

    handleCheckboxChange(hashStr: string) {    
        // this.selectedActants = {}
        // this.selectedActants[hashStr] = true
        for (const key of Object.keys(this.selectedActants)) {
            this.selectedActants[key] = false
        }
        this.selectedActants[hashStr] =
            !this.selectedActants[hashStr];
    }
    
    renderOption(hash: ActionHash) {
    const checkbox = toPromise(this.stewardshipStore.actants.get(hash)).then(
        actantRecord => {
        const hashStr = encodeHashToBase64(hash);
        const id = `${hash}`;
        return html`${this.selectedActants[hashStr]}<input
            type="checkbox"
            id=${id}
            name=${actantRecord?.entry.name}
            ${this.selectedActants[hashStr] ? `checked` : ''}
            @change=${() => this.handleCheckboxChange(hashStr)}
            />
            <label for=${id}>${actantRecord?.entry.name}</label><br />`;
        }
    );
    return html`${until(checkbox, html`<span>Loading...</span>`)}`;
    }

    renderActantSelect() {
        console.log(this._allActants.value.status);
        switch (this._allActants.value.status) {
          case 'pending':
            return html`<span>loading...</span>`;
          case 'complete': {
            const actantHahses = this._allActants.value.value;
            const options = actantHahses.map(hash =>
              this.renderOption(hash)
            );
            return options;
          }
        }
      }
    
    render() {
        return html`${this.renderActantSelect()}`
    }

    static styles = [sharedStyles];
}