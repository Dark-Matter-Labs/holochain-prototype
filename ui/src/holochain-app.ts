import { sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import {
  Profile,
  ProfilesClient,
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import '@holochain-open-dev/profiles/dist/elements/profile-list-item-skeleton.js';
import '@holochain-open-dev/profiles/dist/elements/profile-prompt.js';
import { AsyncStatus, StoreSubscriber } from '@holochain-open-dev/stores';
import {
  ActionHash,
  AppAgentClient,
  AppAgentWebsocket,
  encodeHashToBase64,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
// Replace 'ligth.css' with 'dark.css' if you want the dark theme
import '@shoelace-style/shoelace/dist/themes/light.css';
import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { stewardshipStoreContext } from './stewardship/stewardship/context.js';
import './stewardship/stewardship/elements/all-actants.js';
import './stewardship/stewardship/elements/all-clauses.js';
import './stewardship/stewardship/elements/clause-detail.js';
import './stewardship/stewardship/elements/create-actant.js';
import './stewardship/stewardship/elements/create-clause.js';
import './stewardship/stewardship/elements/create-report.js';
import './stewardship/stewardship/elements/csv-exporter.js';
import { StewardshipClient } from './stewardship/stewardship/stewardship-client.js';
import { StewardshipStore } from './stewardship/stewardship/stewardship-store.js';

type View = { view: 'main' };

@localized()
@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @provide({ context: stewardshipStoreContext })
  @property()
  _stewardshipStore!: StewardshipStore;

  @state() _loading = true;

  @state() _view = { view: 'main' };

  @query('#clause-dialog')
  clauseDialog!: SlDialog;

  @provide({ context: profilesStoreContext })
  @property()
  _profilesStore!: ProfilesStore;

  _client!: AppAgentClient;

  _myProfile!: StoreSubscriber<AsyncStatus<Profile | undefined>>;

  @state()
  showCreateClause = false
  
  @state()
  showCreateActant = false

  async firstUpdated() {
    this._client = await AppAgentWebsocket.connect('', 'stewardship');

    await this.initStores(this._client);

    this._loading = false;
  }

  async initStores(appAgentClient: AppAgentClient) {
    // Don't change this
    this._profilesStore = new ProfilesStore(
      new ProfilesClient(appAgentClient, 'stewardship')
    );
    this._myProfile = new StoreSubscriber(
      this,
      () => this._profilesStore.myProfile
    );
    this._stewardshipStore = new StewardshipStore(
      new StewardshipClient(appAgentClient, 'stewardship')
    );
  }

  renderMyProfile() {
    switch (this._myProfile.value.status) {
      case 'pending':
        return html`<profile-list-item-skeleton></profile-list-item-skeleton>`;
      case 'complete':
        const profile = this._myProfile.value.value;
        if (!profile) return html``;

        return html`<div
          class="row"
          style="align-items: center;"
          slot="actionItems"
        >
          <agent-avatar .agentPubKey=${this._client.myPubKey}></agent-avatar>
          <span style="margin: 0 16px;">${profile?.nickname}</span>
        </div>`;
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the profile')}
          .error=${this._myProfile.value.error.data.data}
          tooltip
        ></display-error>`;
    }
  }

  @state()
  showDetail: ActionHash | undefined;

  // TODO: add here the content of your application
  renderContent() {
    return html`
      <sl-dialog id="clause-dialog" class="dialog-deny-close">
        ${this.showDetail
          ? html`<clause-detail .clauseHash=${this.showDetail}></clause-detail>`
          : `none`}

        <sl-button
          slot="footer"
          variant="primary"
          @click=${() => {
            this.clauseDialog.hide();
          }}
          >Close</sl-button
        >
      </sl-dialog>
      ${this.showDetail ? html`` : ``}
      <div style="min-width:400px;margin:10px">
        <h2>Actants</h2>
        ${this.showCreateActant ?
          html`<create-actant
            @cancel=${()=>{this.showCreateActant = false}}
          ></create-actant>`
          :
        html`
        <sl-button
          variant="primary"
          @click=${() => {
            this.showCreateActant = true
          }}
          >Create Actant</sl-button>`  }
        
        <all-actants></all-actants>
      </div>
      <div style="min-width:400px;margin:10px">
      <h2>Clauses</h2>
        ${this.showCreateClause ?
          html`<create-clause
            @cancel=${()=>{this.showCreateClause = false}}
          ></create-clause>`
          :
        html`
        <sl-button
          variant="primary"
          @click=${() => {
            this.showCreateClause = true
          }}
          >Create Clause</sl-button>`  }
        <all-clauses
          @clause-selected=${(e: CustomEvent) => {
            this.clauseDialog.show();
            this.showDetail = e.detail.clauseHash;
          }}
        ></all-clauses>
        <csv-exporter></csv-exporter>
      </div>
    `;
  }

  renderBackButton() {
    if (this._view.view === 'main') return html``;

    return html`
      <sl-icon-button
        name="arrow-left"
        @click=${() => {
          this._view = { view: 'main' };
        }}
      ></sl-icon-button>
    `;
  }

  render() {
    if (this._loading)
      return html`<div
        class="row"
        style="flex: 1; height: 100%; align-items: center; justify-content: center;"
      >
        <sl-spinner style="font-size: 2rem"></sl-spinner>
      </div>`;

    return html`
      <div class="column fill">
        <div
          class="row"
          style="align-items: center; color:white; background-color: var(--sl-color-primary-900); padding: 16px"
        >
          ${this.renderBackButton()}
          <span class="title" style="flex: 1">${msg('Stewardship')}</span>

          ${this.renderMyProfile()}
        </div>

        <profile-prompt style="flex: 1;">
          ${this.renderContent()}
        </profile-prompt>
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex: 1;
      }
    `,
    sharedStyles,
  ];
}
