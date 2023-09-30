use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Clause {
    pub statement: String,
    pub right_holders: Vec<ActionHash>,
    pub responsibilty_holders: Vec<ActionHash>,
}
pub fn validate_create_clause(
    _action: EntryCreationAction,
    clause: Clause,
) -> ExternResult<ValidateCallbackResult> {
    for action_hash in clause.responsibilty_holders.clone() {
        let record = must_get_valid_record(action_hash)?;
        let _actant: crate::Actant = record
            .entry()
            .to_app_option()
            .map_err(|e| wasm_error!(e))?
            .ok_or(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
                ),
            )?;
    }
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_clause(
    _action: Update,
    _clause: Clause,
    _original_action: EntryCreationAction,
    _original_clause: Clause,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Clauses cannot be updated")))
}
pub fn validate_delete_clause(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_clause: Clause,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_actant_to_clauses(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _actant: crate::Actant = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _clause: crate::Clause = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_actant_to_clauses(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("ActantToClauses links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_all_clauses(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _clause: crate::Clause = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_clauses(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllClauses links cannot be deleted"),
        ),
    )
}
