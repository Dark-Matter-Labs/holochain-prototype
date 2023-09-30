#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use stewardship_integrity::*;


mod common;
use common::{create_clause, sample_clause_1, sample_clause_2};

use common::{create_actant, sample_actant_1, sample_actant_2};

#[tokio::test(flavor = "multi_thread")]
async fn create_clause_test() {
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
    
    let sample = sample_clause_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Clause
    let record: Record = create_clause(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: Clause = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}


#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_clause() {
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
    
    let sample = sample_clause_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Clause
    let record: Record = create_clause(&conductors[0], &alice_zome, sample.clone()).await;
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_clause", record.signed_action.action_address().clone())
        .await;
        
    assert_eq!(record, get_record.unwrap());    
}


#[tokio::test(flavor = "multi_thread")]
async fn create_and_delete_clause() {
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
    
    let sample_1 = sample_clause_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Clause
    let record: Record = create_clause(&conductors[0], &alice_zome, sample_1.clone()).await;
    let original_action_hash = record.signed_action.hashed.hash;
    
    // Alice deletes the Clause
    let _delete_action_hash: ActionHash = conductors[0]
        .call(&alice_zome, "delete_clause", original_action_hash.clone())
        .await;

    consistency_10s([&alice, &bobbo]).await;

    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_clause", original_action_hash.clone())
        .await;
        
    assert!(get_record.is_none());
}
