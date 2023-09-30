pub mod endorsement;
pub use endorsement::*;
pub mod report;
pub use report::*;
pub mod clause;
pub use clause::*;
pub mod actant;
pub use actant::*;
use hdi::prelude::*;
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Actant(Actant),
    Clause(Clause),
    Report(Report),
    Endorsement(Endorsement),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    ActantUpdates,
    ActantToClauses,
    ActantToReports,
    ClauseToReports,
    ReportToEndorsements,
    AllClauses,
    AllActants,
}
#[hdk_extern]
pub fn genesis_self_check(
    _data: GenesisSelfCheckData,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => {
            match store_entry {
                OpEntry::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::Actant(actant) => {
                            validate_create_actant(
                                EntryCreationAction::Create(action),
                                actant,
                            )
                        }
                        EntryTypes::Clause(clause) => {
                            validate_create_clause(
                                EntryCreationAction::Create(action),
                                clause,
                            )
                        }
                        EntryTypes::Report(report) => {
                            validate_create_report(
                                EntryCreationAction::Create(action),
                                report,
                            )
                        }
                        EntryTypes::Endorsement(endorsement) => {
                            validate_create_endorsement(
                                EntryCreationAction::Create(action),
                                endorsement,
                            )
                        }
                    }
                }
                OpEntry::UpdateEntry { app_entry, action, .. } => {
                    match app_entry {
                        EntryTypes::Actant(actant) => {
                            validate_create_actant(
                                EntryCreationAction::Update(action),
                                actant,
                            )
                        }
                        EntryTypes::Clause(clause) => {
                            validate_create_clause(
                                EntryCreationAction::Update(action),
                                clause,
                            )
                        }
                        EntryTypes::Report(report) => {
                            validate_create_report(
                                EntryCreationAction::Update(action),
                                report,
                            )
                        }
                        EntryTypes::Endorsement(endorsement) => {
                            validate_create_endorsement(
                                EntryCreationAction::Update(action),
                                endorsement,
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterUpdate(update_entry) => {
            match update_entry {
                OpUpdate::Entry {
                    original_action,
                    original_app_entry,
                    app_entry,
                    action,
                } => {
                    match (app_entry, original_app_entry) {
                        (
                            EntryTypes::Endorsement(endorsement),
                            EntryTypes::Endorsement(original_endorsement),
                        ) => {
                            validate_update_endorsement(
                                action,
                                endorsement,
                                original_action,
                                original_endorsement,
                            )
                        }
                        (
                            EntryTypes::Report(report),
                            EntryTypes::Report(original_report),
                        ) => {
                            validate_update_report(
                                action,
                                report,
                                original_action,
                                original_report,
                            )
                        }
                        (
                            EntryTypes::Clause(clause),
                            EntryTypes::Clause(original_clause),
                        ) => {
                            validate_update_clause(
                                action,
                                clause,
                                original_action,
                                original_clause,
                            )
                        }
                        (
                            EntryTypes::Actant(actant),
                            EntryTypes::Actant(original_actant),
                        ) => {
                            validate_update_actant(
                                action,
                                actant,
                                original_action,
                                original_actant,
                            )
                        }
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original and updated entry types must be the same"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterDelete(delete_entry) => {
            match delete_entry {
                OpDelete::Entry { original_action, original_app_entry, action } => {
                    match original_app_entry {
                        EntryTypes::Actant(actant) => {
                            validate_delete_actant(action, original_action, actant)
                        }
                        EntryTypes::Clause(clause) => {
                            validate_delete_clause(action, original_action, clause)
                        }
                        EntryTypes::Report(report) => {
                            validate_delete_report(action, original_action, report)
                        }
                        EntryTypes::Endorsement(endorsement) => {
                            validate_delete_endorsement(
                                action,
                                original_action,
                                endorsement,
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => {
            match link_type {
                LinkTypes::ActantUpdates => {
                    validate_create_link_actant_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ActantToClauses => {
                    validate_create_link_actant_to_clauses(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ActantToReports => {
                    validate_create_link_actant_to_reports(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ClauseToReports => {
                    validate_create_link_clause_to_reports(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ReportToEndorsements => {
                    validate_create_link_report_to_endorsements(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllClauses => {
                    validate_create_link_all_clauses(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllActants => {
                    validate_create_link_all_actants(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        FlatOp::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => {
            match link_type {
                LinkTypes::ActantUpdates => {
                    validate_delete_link_actant_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ActantToClauses => {
                    validate_delete_link_actant_to_clauses(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ActantToReports => {
                    validate_delete_link_actant_to_reports(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ClauseToReports => {
                    validate_delete_link_clause_to_reports(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ReportToEndorsements => {
                    validate_delete_link_report_to_endorsements(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllClauses => {
                    validate_delete_link_all_clauses(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllActants => {
                    validate_delete_link_all_actants(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        FlatOp::StoreRecord(store_record) => {
            match store_record {
                OpRecord::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::Actant(actant) => {
                            validate_create_actant(
                                EntryCreationAction::Create(action),
                                actant,
                            )
                        }
                        EntryTypes::Clause(clause) => {
                            validate_create_clause(
                                EntryCreationAction::Create(action),
                                clause,
                            )
                        }
                        EntryTypes::Report(report) => {
                            validate_create_report(
                                EntryCreationAction::Create(action),
                                report,
                            )
                        }
                        EntryTypes::Endorsement(endorsement) => {
                            validate_create_endorsement(
                                EntryCreationAction::Create(action),
                                endorsement,
                            )
                        }
                    }
                }
                OpRecord::UpdateEntry {
                    original_action_hash,
                    app_entry,
                    action,
                    ..
                } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for an update must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match app_entry {
                        EntryTypes::Actant(actant) => {
                            let result = validate_create_actant(
                                EntryCreationAction::Update(action.clone()),
                                actant.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_actant: Option<Actant> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_actant = match original_actant {
                                    Some(actant) => actant,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_actant(
                                    action,
                                    actant,
                                    original_action,
                                    original_actant,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Clause(clause) => {
                            let result = validate_create_clause(
                                EntryCreationAction::Update(action.clone()),
                                clause.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_clause: Option<Clause> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_clause = match original_clause {
                                    Some(clause) => clause,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_clause(
                                    action,
                                    clause,
                                    original_action,
                                    original_clause,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Report(report) => {
                            let result = validate_create_report(
                                EntryCreationAction::Update(action.clone()),
                                report.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_report: Option<Report> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_report = match original_report {
                                    Some(report) => report,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_report(
                                    action,
                                    report,
                                    original_action,
                                    original_report,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Endorsement(endorsement) => {
                            let result = validate_create_endorsement(
                                EntryCreationAction::Update(action.clone()),
                                endorsement.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_endorsement: Option<Endorsement> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_endorsement = match original_endorsement {
                                    Some(endorsement) => endorsement,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_endorsement(
                                    action,
                                    endorsement,
                                    original_action,
                                    original_endorsement,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                    }
                }
                OpRecord::DeleteEntry { original_action_hash, action, .. } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for a delete must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let app_entry_type = match original_action.entry_type() {
                        EntryType::App(app_entry_type) => app_entry_type,
                        _ => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    let entry = match original_record.entry().as_option() {
                        Some(entry) => entry,
                        None => {
                            if original_action.entry_type().visibility().is_public() {
                                return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                            } else {
                                return Ok(ValidateCallbackResult::Valid);
                            }
                        }
                    };
                    let original_app_entry = match EntryTypes::deserialize_from_type(
                        app_entry_type.zome_index.clone(),
                        app_entry_type.entry_index.clone(),
                        &entry,
                    )? {
                        Some(app_entry) => app_entry,
                        None => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original app entry must be one of the defined entry types for this zome"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match original_app_entry {
                        EntryTypes::Actant(original_actant) => {
                            validate_delete_actant(
                                action,
                                original_action,
                                original_actant,
                            )
                        }
                        EntryTypes::Clause(original_clause) => {
                            validate_delete_clause(
                                action,
                                original_action,
                                original_clause,
                            )
                        }
                        EntryTypes::Report(original_report) => {
                            validate_delete_report(
                                action,
                                original_action,
                                original_report,
                            )
                        }
                        EntryTypes::Endorsement(original_endorsement) => {
                            validate_delete_endorsement(
                                action,
                                original_action,
                                original_endorsement,
                            )
                        }
                    }
                }
                OpRecord::CreateLink {
                    base_address,
                    target_address,
                    tag,
                    link_type,
                    action,
                } => {
                    match link_type {
                        LinkTypes::ActantUpdates => {
                            validate_create_link_actant_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ActantToClauses => {
                            validate_create_link_actant_to_clauses(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ActantToReports => {
                            validate_create_link_actant_to_reports(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ClauseToReports => {
                            validate_create_link_clause_to_reports(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ReportToEndorsements => {
                            validate_create_link_report_to_endorsements(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllClauses => {
                            validate_create_link_all_clauses(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllActants => {
                            validate_create_link_all_actants(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                    }
                }
                OpRecord::DeleteLink { original_action_hash, base_address, action } => {
                    let record = must_get_valid_record(original_action_hash)?;
                    let create_link = match record.action() {
                        Action::CreateLink(create_link) => create_link.clone(),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "The action that a DeleteLink deletes must be a CreateLink"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let link_type = match LinkTypes::from_type(
                        create_link.zome_index.clone(),
                        create_link.link_type.clone(),
                    )? {
                        Some(lt) => lt,
                        None => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    match link_type {
                        LinkTypes::ActantUpdates => {
                            validate_delete_link_actant_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ActantToClauses => {
                            validate_delete_link_actant_to_clauses(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ActantToReports => {
                            validate_delete_link_actant_to_reports(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ClauseToReports => {
                            validate_delete_link_clause_to_reports(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ReportToEndorsements => {
                            validate_delete_link_report_to_endorsements(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllClauses => {
                            validate_delete_link_all_clauses(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllActants => {
                            validate_delete_link_all_actants(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                    }
                }
                OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterAgentActivity(agent_activity) => {
            match agent_activity {
                OpActivity::CreateAgent { agent, action } => {
                    let previous_action = must_get_action(action.prev_action)?;
                    match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
    }
}
