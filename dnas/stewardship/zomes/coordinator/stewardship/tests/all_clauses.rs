#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

mod common;
use common::{create_clause, sample_clause_1};

#[tokio::test(flavor = "multi_thread")]
async fn create_a_clause_and_get_all_clauses() {
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
    
    let get_records: Vec<Record> = conductors[1]
        .call(&bob_zome, "get_all_clauses", ())
        .await;
        
    assert_eq!(get_records.len(), 1);    
    assert_eq!(get_records[0], record);    
}


