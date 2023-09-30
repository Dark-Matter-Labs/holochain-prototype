use hdk::prelude::*;
use holochain::sweettest::*;

use stewardship_integrity::*;



pub async fn sample_actant_1(conductor: &SweetConductor, zome: &SweetZome) -> Actant {
    Actant {
	  agents: vec![::fixt::fixt!(AgentPubKey)],
	  name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
    }
}

pub async fn sample_actant_2(conductor: &SweetConductor, zome: &SweetZome) -> Actant {
    Actant {
	  agents: vec![::fixt::fixt!(AgentPubKey)],
	  name: "Lorem ipsum 2".to_string(),
    }
}

pub async fn create_actant(conductor: &SweetConductor, zome: &SweetZome, actant: Actant) -> Record {
    let record: Record = conductor
        .call(zome, "create_actant", actant)
        .await;
    record
}



pub async fn sample_clause_1(conductor: &SweetConductor, zome: &SweetZome) -> Clause {
    Clause {
	  statement: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  right_holders: vec![::fixt::fixt!(ActionHash)],
          responsibilty_holders: vec![create_actant(conductor, zome, sample_actant_1(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn sample_clause_2(conductor: &SweetConductor, zome: &SweetZome) -> Clause {
    Clause {
	  statement: "Lorem ipsum 2".to_string(),
	  right_holders: vec![::fixt::fixt!(ActionHash)],
          responsibilty_holders: vec![create_actant(conductor, zome, sample_actant_2(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn create_clause(conductor: &SweetConductor, zome: &SweetZome, clause: Clause) -> Record {
    let record: Record = conductor
        .call(zome, "create_clause", clause)
        .await;
    record
}



pub async fn sample_report_1(conductor: &SweetConductor, zome: &SweetZome) -> Report {
    Report {
	  report_type: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
          actant_hash: create_actant(conductor, zome, sample_actant_1(conductor, zome).await).await.signed_action.hashed.hash,
          clause_hash: create_clause(conductor, zome, sample_clause_1(conductor, zome).await).await.signed_action.hashed.hash,
    }
}

pub async fn sample_report_2(conductor: &SweetConductor, zome: &SweetZome) -> Report {
    Report {
	  report_type: "Lorem ipsum 2".to_string(),
	  content: "Lorem ipsum 2".to_string(),
          actant_hash: create_actant(conductor, zome, sample_actant_2(conductor, zome).await).await.signed_action.hashed.hash,
          clause_hash: create_clause(conductor, zome, sample_clause_2(conductor, zome).await).await.signed_action.hashed.hash,
    }
}

pub async fn create_report(conductor: &SweetConductor, zome: &SweetZome, report: Report) -> Record {
    let record: Record = conductor
        .call(zome, "create_report", report)
        .await;
    record
}



pub async fn sample_endorsement_1(conductor: &SweetConductor, zome: &SweetZome) -> Endorsement {
    Endorsement {
          report_hash: create_report(conductor, zome, sample_report_1(conductor, zome).await).await.signed_action.hashed.hash,
    }
}

pub async fn sample_endorsement_2(conductor: &SweetConductor, zome: &SweetZome) -> Endorsement {
    Endorsement {
          report_hash: create_report(conductor, zome, sample_report_2(conductor, zome).await).await.signed_action.hashed.hash,
    }
}

pub async fn create_endorsement(conductor: &SweetConductor, zome: &SweetZome, endorsement: Endorsement) -> Record {
    let record: Record = conductor
        .call(zome, "create_endorsement", endorsement)
        .await;
    record
}

