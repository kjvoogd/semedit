## ADDED Requirements

### Requirement: User can import a Turtle file to populate the tree
The system SHALL provide an "Import" link on the right side of the header bar that opens a file picker allowing the user to select a `.ttl` (Turtle) file from disk. On selection the file SHALL be parsed and the resulting SKOS concept hierarchy SHALL replace the current tree.

#### Scenario: Import link is always visible in the header
- **WHEN** the application is displayed
- **THEN** an "Import" link is visible on the right side of the header bar at all times

#### Scenario: Selecting a valid Turtle file replaces the tree
- **WHEN** the user clicks "Import…" and selects a valid Turtle file containing SKOS concepts
- **THEN** the navigation tree is replaced with the SKOS concept hierarchy extracted from the file

#### Scenario: Imported tree is persisted to the session
- **WHEN** a Turtle file is successfully imported
- **THEN** the resulting tree is saved to sessionStorage and survives a page reload

### Requirement: Turtle vocabulary nodes are mapped to tree nodes
The system SHALL detect whether the imported Turtle file uses SKOS or pcicore vocabulary and extract the node hierarchy accordingly, mapping each node to a `TreeItem`.

The label lookup SHALL try `skos:prefLabel`, then `dcterms:title`, then `rdfs:label` (preferring `@en` over any other language), falling back to the URI local name.

**SKOS** (`skos:Concept` triples present): hierarchy via `skos:narrower` / `skos:broader`; roots from `skos:hasTopConcept`, `skos:topConceptOf`, or absence of `skos:broader`.

**pcicore** (`pcicore:isContained` triples present): hierarchy via `pcicore:relatesToChild` / `pcicore:isContained`; roots are objects of `pcicore:isContained` that are not themselves subjects of `pcicore:isContained`.

#### Scenario: skos:prefLabel becomes the node label
- **WHEN** a concept has a `skos:prefLabel` triple
- **THEN** the node label is set to that literal value (preferring `@en` if multiple languages are present)

#### Scenario: dcterms:title used when prefLabel is absent
- **WHEN** a concept has no `skos:prefLabel` but has a `dcterms:title` triple
- **THEN** the node label is set to that title literal (preferring `@en`)

#### Scenario: URI local name used as fallback label
- **WHEN** a concept has no recognised label predicate
- **THEN** the node label is set to the local name of the concept URI (fragment identifier or last path segment)

#### Scenario: skos:narrower determines child nodes
- **WHEN** a concept has `skos:narrower` triples
- **THEN** the referenced concepts are rendered as its children in the tree

#### Scenario: Root concepts have no parent
- **WHEN** a concept appears in `skos:hasTopConcept`, `skos:topConceptOf`, or has no `skos:broader` triple
- **THEN** it is rendered as a root-level node in the tree

#### Scenario: pcicore vocabulary is used when isContained triples are present
- **WHEN** the Turtle file contains `pcicore:isContained` triples
- **THEN** the tree is built using `pcicore:relatesToChild` for parent–child relationships

### Requirement: Import errors are shown inline in the header
The system SHALL display a clear inline error message next to the Import link in the header when the selected file cannot be parsed or contains no recognisable nodes, without replacing the current tree.

#### Scenario: Parse error is shown inline
- **WHEN** the user imports a file that is not valid Turtle
- **THEN** an error message is shown next to the Import link in the header and the existing tree is unchanged

#### Scenario: No concepts error is shown inline
- **WHEN** the user imports a valid Turtle file that contains no recognisable hierarchy nodes
- **THEN** an error message is shown next to the Import link in the header stating that no nodes were found and the existing tree is unchanged
