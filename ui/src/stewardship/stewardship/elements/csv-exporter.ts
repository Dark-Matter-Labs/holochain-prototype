import { notifyError, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import { toPromise } from '@holochain-open-dev/stores';
import { ActionHash, encodeHashToBase64 } from '@holochain/client';
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

  async getJoinedActantNames(hashes: ActionHash[]) {
    const proms = hashes.map(async hash => {
      const record = await toPromise(this.stewardshipStore.actants.get(hash));
      return record?.entry.name;
    });
    const names = await Promise.all(proms);
    return names.join(',');
  }

  async getRecords() {
    const actantRecordsProm = toPromise(this.stewardshipStore.allActants).then(
      hashes =>
        Promise.all(
          hashes.map(hash => toPromise(this.stewardshipStore.actants.get(hash)))
        )
    );

    const clauseRecordsProm = toPromise(this.stewardshipStore.allClauses).then(
      hashes =>
        Promise.all(
          hashes.map(hash => toPromise(this.stewardshipStore.clauses.get(hash)))
        )
    );

    const actantRecords = await actantRecordsProm;
    const clauseRecords = await clauseRecordsProm;
    return { actantRecords, clauseRecords };
  }

  async exportEntries() {
    this.isBusy = true;
    try {
      const { actantRecords, clauseRecords } = await this.getRecords();

      const entries: string[][] = [];
      for (const actantRecord of actantRecords) {
        if (actantRecord) {
          entries.push(['Actant', actantRecord.entry.name]);
        }
      }
      for (const clauseRecord of clauseRecords) {
        if (clauseRecord) {
          entries.push(['Clause', clauseRecord.entry.title]);
        }
      }

      const headers = ['Type', 'Label'];
      const csvStr = toCsvString([headers, ...entries]);
      await navigator.clipboard.writeText(csvStr);
    } catch (e: any) {
      notifyError(msg('Error exporting csv'));
      console.error(e);
    }
    this.isBusy = false;
  }

  async exportEdges() {
    this.isBusy = true;
    try {
      const { actantRecords, clauseRecords } = await this.getRecords();

      // TODO: protect against duplicate names?
      const hashToName: { [hash: string]: string } = {};
      for (const actantRecord of actantRecords) {
        if (actantRecord) {
          hashToName[encodeHashToBase64(actantRecord.actionHash)] =
            actantRecord.entry.name;
        }
      }

      const entries: string[][] = [];
      for (const clauseRecord of clauseRecords) {
        if (clauseRecord) {
          for (const actant of clauseRecord.entry.right_holders) {
            entries.push([
              clauseRecord.entry.title,
              hashToName[encodeHashToBase64(actant)],
            ]);
          }
          for (const actant of clauseRecord.entry.responsibilty_holders) {
            entries.push([
              hashToName[encodeHashToBase64(actant)],
              clauseRecord.entry.title,
            ]);
          }
        }
      }

      const headers = ['From', 'To'];
      const csvStr = toCsvString([headers, ...entries]);
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
        style="display: flex; flex: 1; gap: 10px; align-items: center; justify-content: center"
      >
        <sl-button @click=${this.exportEntries} .disable=${this.isBusy}
          >Copy graph nodes CSV</sl-button
        >
        <sl-button @click=${this.exportEdges} .disable=${this.isBusy}
          >Copy graph edges CSV</sl-button
        >
      </div>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
