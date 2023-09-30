use hdk::prelude::*;
use stewardship_integrity::*;
#[hdk_extern]
pub fn create_clause(clause: Clause) -> ExternResult<Record> {
    let clause_hash = create_entry(&EntryTypes::Clause(clause.clone()))?;
    for base in clause.responsibilty_holders.clone() {
        create_link(base, clause_hash.clone(), LinkTypes::ActantToClauses, ())?;
    }
    for base in clause.right_holders.clone() {
        create_link(base, clause_hash.clone(), LinkTypes::ActantToClauses, ())?;
    }
    let record = get(clause_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Clause"))
            ),
        )?;
    let path = Path::from("all_clauses");
    create_link(
        path.path_entry_hash()?,
        clause_hash.clone(),
        LinkTypes::AllClauses,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_clause(clause_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(clause_hash, GetOptions::default())
}
#[hdk_extern]
pub fn delete_clause(original_clause_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_clause_hash)
}
#[hdk_extern]
pub fn get_clauses_for_actant(actant_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(actant_hash, LinkTypes::ActantToClauses, None)?;
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
