use hdk::prelude::*;
use stewardship_integrity::*;
#[hdk_extern]
pub fn create_endorsement(endorsement: Endorsement) -> ExternResult<Record> {
    let endorsement_hash = create_entry(&EntryTypes::Endorsement(endorsement.clone()))?;
    create_link(
        endorsement.report_hash.clone(),
        endorsement_hash.clone(),
        LinkTypes::ReportToEndorsements,
        (),
    )?;
    let record = get(endorsement_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Endorsement"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_endorsement(endorsement_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(endorsement_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_endorsements_for_report(
    report_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(report_hash, LinkTypes::ReportToEndorsements, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
