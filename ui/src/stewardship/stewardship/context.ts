import { createContext } from '@lit-labs/context';

import { StewardshipStore } from './stewardship-store';

export const stewardshipStoreContext = createContext<StewardshipStore>(
  'hc_zome_stewardship/store'
);
