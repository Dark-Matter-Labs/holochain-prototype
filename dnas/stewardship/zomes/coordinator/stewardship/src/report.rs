use hdk::prelude::*;
use stewardship_integrity::*;
#[hdk_extern]
pub fn create_report(report: Report) -> ExternResult<Record> {
    let report_hash = create_entry(&EntryTypes::Report(report.clone()))?;
    create_link(
        report.actant_hash.clone(),
        report_hash.clone(),
        LinkTypes::ActantToReports,
        (),
    )?;
    create_link(
        report.clause_hash.clone(),
        report_hash.clone(),
        LinkTypes::ClauseToReports,
        (),
    )?;
    let record = get(report_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Report"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_report(report_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(report_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_reports_for_actant(actant_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(actant_hash, LinkTypes::ActantToReports, None)?;
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
#[hdk_extern]
pub fn get_reports_for_clause(clause_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(clause_hash, LinkTypes::ClauseToReports, None)?;
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
