#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use stewardship_integrity::*;


mod common;
use common::{create_report, sample_report_1, sample_report_2};

use common::{create_actant, sample_actant_1, sample_actant_2};
use common::{create_clause, sample_clause_1, sample_clause_2};

#[tokio::test(flavor = "multi_thread")]
async fn create_report_test() {
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
    
    let sample = sample_report_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Report
    let record: Record = create_report(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: Report = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}


#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_report() {
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
    
    let sample = sample_report_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Report
    let record: Record = create_report(&conductors[0], &alice_zome, sample.clone()).await;
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_report", record.signed_action.action_address().clone())
        .await;
        
    assert_eq!(record, get_record.unwrap());    
}


