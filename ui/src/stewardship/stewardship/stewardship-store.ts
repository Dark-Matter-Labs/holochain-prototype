import { AsyncReadable, lazyLoadAndPoll } from '@holochain-open-dev/stores';
import { EntryRecord, LazyHoloHashMap } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  EntryHash,
  NewEntryAction,
  Record,
} from '@holochain/client';

import { StewardshipClient } from './stewardship-client.js';
import { Endorsement } from './types';
import { Report } from './types';
import { Clause } from './types';
import { Actant } from './types';

export class StewardshipStore {
  constructor(public client: StewardshipClient) {}

  /** Actant */

  actants = new LazyHoloHashMap((actantHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getActant(actantHash), 4000)
  );

  /** Clause */

  clauses = new LazyHoloHashMap((clauseHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getClause(clauseHash), 4000)
  );

  clausesForActant = new LazyHoloHashMap((actantHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getClausesForActant(actantHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** Report */

  reports = new LazyHoloHashMap((reportHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getReport(reportHash), 4000)
  );

  reportsForActant = new LazyHoloHashMap((actantHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getReportsForActant(actantHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  reportsForClause = new LazyHoloHashMap((clauseHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getReportsForClause(clauseHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** Endorsement */

  endorsements = new LazyHoloHashMap((endorsementHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => this.client.getEndorsement(endorsementHash),
      4000
    )
  );

  endorsementsForReport = new LazyHoloHashMap((reportHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getEndorsementsForReport(reportHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** All Clauses */

  allClauses = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllClauses();
    return records.map(r => r.actionHash);
  }, 4000);

  /** All Actants */

  allActants = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllActants();
    return records.map(r => r.actionHash);
  }, 4000);
}
