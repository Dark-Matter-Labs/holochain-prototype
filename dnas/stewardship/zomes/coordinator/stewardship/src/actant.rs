use hdk::prelude::*;
use stewardship_integrity::*;
#[hdk_extern]
pub fn create_actant(actant: Actant) -> ExternResult<Record> {
    let actant_hash = create_entry(&EntryTypes::Actant(actant.clone()))?;
    let record = get(actant_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Actant"))
            ),
        )?;
    let path = Path::from("all_actants");
    create_link(
        path.path_entry_hash()?,
        actant_hash.clone(),
        LinkTypes::AllActants,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_actant(original_actant_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(original_actant_hash.clone(), LinkTypes::ActantUpdates, None)?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_actant_hash = match latest_link {
        Some(link) => ActionHash::from(link.target.clone()),
        None => original_actant_hash.clone(),
    };
    get(latest_actant_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateActantInput {
    pub original_actant_hash: ActionHash,
    pub previous_actant_hash: ActionHash,
    pub updated_actant: Actant,
}
#[hdk_extern]
pub fn update_actant(input: UpdateActantInput) -> ExternResult<Record> {
    let updated_actant_hash = update_entry(
        input.previous_actant_hash.clone(),
        &input.updated_actant,
    )?;
    create_link(
        input.original_actant_hash.clone(),
        updated_actant_hash.clone(),
        LinkTypes::ActantUpdates,
        (),
    )?;
    let record = get(updated_actant_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Actant"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_actant(original_actant_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_actant_hash)
}
