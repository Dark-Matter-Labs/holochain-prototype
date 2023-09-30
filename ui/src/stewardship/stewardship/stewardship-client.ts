import {
  EntryRecord,
  ZomeClient,
  isSignalFromCellWithRole,
} from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  AppAgentClient,
  EntryHash,
  Record,
} from '@holochain/client';

import { Endorsement } from './types';
import { Report } from './types';
import { Clause } from './types';
import { Actant } from './types';
import { StewardshipSignal } from './types.js';

export class StewardshipClient extends ZomeClient<StewardshipSignal> {
  constructor(
    public client: AppAgentClient,
    public roleName: string,
    public zomeName = 'stewardship'
  ) {
    super(client, roleName, zomeName);
  }
  /** Actant */

  async createActant(actant: Actant): Promise<EntryRecord<Actant>> {
    const record: Record = await this.callZome('create_actant', actant);
    return new EntryRecord(record);
  }

  async getActant(
    actantHash: ActionHash
  ): Promise<EntryRecord<Actant> | undefined> {
    const record: Record = await this.callZome('get_actant', actantHash);
    return record ? new EntryRecord(record) : undefined;
  }

  deleteActant(originalActantHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_actant', originalActantHash);
  }

  async updateActant(
    originalActantHash: ActionHash,
    previousActantHash: ActionHash,
    updatedActant: Actant
  ): Promise<EntryRecord<Actant>> {
    const record: Record = await this.callZome('update_actant', {
      original_actant_hash: originalActantHash,
      previous_actant_hash: previousActantHash,
      updated_actant: updatedActant,
    });
    return new EntryRecord(record);
  }
  /** Clause */

  async createClause(clause: Clause): Promise<EntryRecord<Clause>> {
    const record: Record = await this.callZome('create_clause', clause);
    return new EntryRecord(record);
  }

  async getClause(
    clauseHash: ActionHash
  ): Promise<EntryRecord<Clause> | undefined> {
    const record: Record = await this.callZome('get_clause', clauseHash);
    return record ? new EntryRecord(record) : undefined;
  }

  deleteClause(originalClauseHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_clause', originalClauseHash);
  }

  async getClausesForActant(
    actantHash: ActionHash
  ): Promise<Array<EntryRecord<Clause>>> {
    const records: Record[] = await this.callZome(
      'get_clauses_for_actant',
      actantHash
    );
    return records.map(r => new EntryRecord(r));
  }
  /** Report */

  async createReport(report: Report): Promise<EntryRecord<Report>> {
    const record: Record = await this.callZome('create_report', report);
    return new EntryRecord(record);
  }

  async getReport(
    reportHash: ActionHash
  ): Promise<EntryRecord<Report> | undefined> {
    const record: Record = await this.callZome('get_report', reportHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getReportsForActant(
    actantHash: ActionHash
  ): Promise<Array<EntryRecord<Report>>> {
    const records: Record[] = await this.callZome(
      'get_reports_for_actant',
      actantHash
    );
    return records.map(r => new EntryRecord(r));
  }

  async getReportsForClause(
    clauseHash: ActionHash
  ): Promise<Array<EntryRecord<Report>>> {
    const records: Record[] = await this.callZome(
      'get_reports_for_clause',
      clauseHash
    );
    return records.map(r => new EntryRecord(r));
  }
  /** Endorsement */

  async createEndorsement(
    endorsement: Endorsement
  ): Promise<EntryRecord<Endorsement>> {
    const record: Record = await this.callZome(
      'create_endorsement',
      endorsement
    );
    return new EntryRecord(record);
  }

  async getEndorsement(
    endorsementHash: ActionHash
  ): Promise<EntryRecord<Endorsement> | undefined> {
    const record: Record = await this.callZome(
      'get_endorsement',
      endorsementHash
    );
    return record ? new EntryRecord(record) : undefined;
  }

  async getEndorsementsForReport(
    reportHash: ActionHash
  ): Promise<Array<EntryRecord<Endorsement>>> {
    const records: Record[] = await this.callZome(
      'get_endorsements_for_report',
      reportHash
    );
    return records.map(r => new EntryRecord(r));
  }

  /** All Clauses */

  async getAllClauses(): Promise<Array<EntryRecord<Clause>>> {
    const records: Record[] = await this.callZome('get_all_clauses', null);
    return records.map(r => new EntryRecord(r));
  }

  /** All Actants */

  async getAllActants(): Promise<Array<EntryRecord<Actant>>> {
    const records: Record[] = await this.callZome('get_all_actants', null);
    return records.map(r => new EntryRecord(r));
  }
}
