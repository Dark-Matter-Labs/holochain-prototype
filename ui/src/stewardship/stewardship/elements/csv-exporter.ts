import { notifyError, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import { toPromise } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { stringify as toCsvString } from 'csv-stringify/sync';
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { stewardshipStoreContext } from '../context.js';
import { StewardshipStore } from '../stewardship-store.js';
import { Clause } from '../types.js';

/**
 * @element csv-exporter
 */
@localized()
@customElement('csv-exporter')
export class CsvExporter extends LitElement {
  /**
   * @internal
   */
  @consume({ context: stewardshipStoreContext, subscribe: true })
  stewardshipStore!: StewardshipStore;

  @state()
  isBusy = false;

  download(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
    );
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  async getJoinedActantNames(hashes: ActionHash[]) {
    const proms = hashes.map(async hash => {
      const record = await toPromise(this.stewardshipStore.actants.get(hash));
      return record?.entry.name;
    });
    const names = await Promise.all(proms);
    return names.join(',');
  }

  async exportClauses() {
    this.isBusy = true;
    try {
      const clauseHashes = await toPromise(this.stewardshipStore.allClauses);

      const clauseRecordPromises = clauseHashes.map(hash =>
        toPromise(this.stewardshipStore.clauses.get(hash))
      );
      const records = await Promise.all(clauseRecordPromises);

      const headers = [
        'Title',
        'Statement',
        'Right Holders',
        'Responsibility Holders',
      ];
      const entryProms = records
        .filter(
          (x: EntryRecord<Clause> | undefined): x is EntryRecord<Clause> => !!x
        )
        .map(async record => [
          record.entry.title,
          record.entry.statement,
          await this.getJoinedActantNames(record.entry.right_holders),
          await this.getJoinedActantNames(record.entry.responsibilty_holders),
        ]);
      const rows = [headers, ...(await Promise.all(entryProms))];
      const csvStr = toCsvString(rows);
      await navigator.clipboard.writeText(csvStr);
    } catch (e: any) {
      notifyError(msg('Error exporting csv'));
      console.error(e);
    }
    this.isBusy = false;
  }

  render() {
    return html`<sl-card>
      <div
        style="display: flex; flex: 1; align-items: center; justify-content: center"
      >
        <sl-button @click=${this.exportClauses} .disable=${this.isBusy}
          >Copy Clauses CSV</sl-button
        >
      </div>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
