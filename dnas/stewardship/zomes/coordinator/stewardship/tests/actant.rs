#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use stewardship_integrity::*;

use stewardship::actant::UpdateActantInput;

mod common;
use common::{create_actant, sample_actant_1, sample_actant_2};


#[tokio::test(flavor = "multi_thread")]
async fn create_actant_test() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/stewardship.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("stewardship", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (_bobbo,)) = apps.into_tuples();
    
    let alice_zome = alice.zome("stewardship");
    
    let sample = sample_actant_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Actant
    let record: Record = create_actant(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: Actant = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}


#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_actant() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/stewardship.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("stewardship", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (bobbo,)) = apps.into_tuples();
    
    let alice_zome = alice.zome("stewardship");
    let bob_zome = bobbo.zome("stewardship");
    
    let sample = sample_actant_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Actant
    let record: Record = create_actant(&conductors[0], &alice_zome, sample.clone()).await;
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_actant", record.signed_action.action_address().clone())
        .await;
        
    assert_eq!(record, get_record.unwrap());    
}

#[tokio::test(flavor = "multi_thread")]
async fn create_and_update_actant() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/stewardship.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("stewardship", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (bobbo,)) = apps.into_tuples();
    
    let alice_zome = alice.zome("stewardship");
    let bob_zome = bobbo.zome("stewardship");
    
    let sample_1 = sample_actant_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Actant
    let record: Record = create_actant(&conductors[0], &alice_zome, sample_1.clone()).await;
    let original_action_hash = record.signed_action.hashed.hash.clone();
        
    consistency_10s([&alice, &bobbo]).await;
    
    let sample_2 = sample_actant_2(&conductors[0], &alice_zome).await;
    let input = UpdateActantInput {
      original_actant_hash: original_action_hash.clone(),
      previous_actant_hash: original_action_hash.clone(),
      updated_actant: sample_2.clone(),
    };
    
    // Alice updates the Actant
    let update_record: Record = conductors[0]
        .call(&alice_zome, "update_actant", input)
        .await;
        
    let entry: Actant = update_record.entry().to_app_option().unwrap().unwrap();
    assert_eq!(sample_2, entry);
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_actant", original_action_hash.clone())
        .await;
  
    assert_eq!(update_record, get_record.unwrap());
    
    let input = UpdateActantInput {
      original_actant_hash: original_action_hash.clone(),
      previous_actant_hash: update_record.signed_action.hashed.hash.clone(),
      updated_actant: sample_1.clone(),
    };
    
    // Alice updates the Actant again
    let update_record: Record = conductors[0]
        .call(&alice_zome, "update_actant", input)
        .await;
        
    let entry: Actant = update_record.entry().to_app_option().unwrap().unwrap();
    assert_eq!(sample_1, entry);
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_actant", original_action_hash.clone())
        .await;
  
    assert_eq!(update_record, get_record.unwrap());
}

#[tokio::test(flavor = "multi_thread")]
async fn create_and_delete_actant() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/stewardship.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("stewardship", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (bobbo,)) = apps.into_tuples();
    
    let alice_zome = alice.zome("stewardship");
    let bob_zome = bobbo.zome("stewardship");
    
    let sample_1 = sample_actant_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Actant
    let record: Record = create_actant(&conductors[0], &alice_zome, sample_1.clone()).await;
    let original_action_hash = record.signed_action.hashed.hash;
    
    // Alice deletes the Actant
    let _delete_action_hash: ActionHash = conductors[0]
        .call(&alice_zome, "delete_actant", original_action_hash.clone())
        .await;

    consistency_10s([&alice, &bobbo]).await;

    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_actant", original_action_hash.clone())
        .await;
        
    assert!(get_record.is_none());
}
