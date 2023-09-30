use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Endorsement {
    pub report_hash: ActionHash,
}
pub fn validate_create_endorsement(
    _action: EntryCreationAction,
    endorsement: Endorsement,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(endorsement.report_hash.clone())?;
    let _report: crate::Report = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_endorsement(
    _action: Update,
    _endorsement: Endorsement,
    _original_action: EntryCreationAction,
    _original_endorsement: Endorsement,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Endorsements cannot be updated")))
}
pub fn validate_delete_endorsement(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_endorsement: Endorsement,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Endorsements cannot be deleted")))
}
pub fn validate_create_link_report_to_endorsements(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _report: crate::Report = record
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
    let _endorsement: crate::Endorsement = record
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
pub fn validate_delete_link_report_to_endorsements(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("ReportToEndorsements links cannot be deleted"),
        ),
    )
}
