import {
  ActionHash,
  AgentPubKey,
  Create,
  CreateLink,
  Delete,
  DeleteLink,
  DnaHash,
  EntryHash,
  Record,
  SignedActionHashed,
  Update,
} from '@holochain/client';

export type StewardshipSignal =
  | {
      type: 'EntryCreated';
      action: SignedActionHashed<Create>;
      app_entry: EntryTypes;
    }
  | {
      type: 'EntryUpdated';
      action: SignedActionHashed<Update>;
      app_entry: EntryTypes;
      original_app_entry: EntryTypes;
    }
  | {
      type: 'EntryDeleted';
      action: SignedActionHashed<Delete>;
      original_app_entry: EntryTypes;
    }
  | {
      type: 'LinkCreated';
      action: SignedActionHashed<CreateLink>;
      link_type: string;
    }
  | {
      type: 'LinkDeleted';
      action: SignedActionHashed<DeleteLink>;
      link_type: string;
    };

export type EntryTypes =
  | ({ type: 'Endorsement' } & Endorsement)
  | ({ type: 'Report' } & Report)
  | ({ type: 'Clause' } & Clause)
  | ({ type: 'Actant' } & Actant);

export interface Actant {
  agents: Array<AgentPubKey>;

  name: string;
}

export interface Clause {
  statement: string;

  right_holders: Array<ActionHash>;

  responsibilty_holders: Array<ActionHash>;
}

export interface Report {
  report_type: string;

  content: string;

  actant_hash: ActionHash;

  clause_hash: ActionHash;
}

export interface Endorsement {
  report_hash: ActionHash;
}
