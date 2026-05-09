### Requirement: SecurityTombola validates every uploaded file
The system SHALL provide a `SecurityTombola` class with a `check(file)` method that throws a `SecurityError` if any validation rule fails. The route handler SHALL call `SecurityTombola.check(file)` before passing the file to the parser or loader.

#### Scenario: Valid file passes all checks
- **WHEN** a file with `.ttl` extension, acceptable MIME type, size ≤ 50 MB, and valid UTF-8 Turtle content is uploaded
- **THEN** `SecurityTombola.check()` returns without throwing

#### Scenario: Wrong extension is rejected
- **WHEN** a file without a `.ttl` extension is uploaded
- **THEN** `SecurityTombola.check()` throws a `SecurityError` with a descriptive message

#### Scenario: Binary file is rejected
- **WHEN** a file whose first bytes contain binary (non-UTF-8) content is uploaded
- **THEN** `SecurityTombola.check()` throws a `SecurityError`

#### Scenario: Oversized file is rejected
- **WHEN** a file larger than 50 MB is uploaded
- **THEN** `SecurityTombola.check()` throws a `SecurityError` indicating the size limit

### Requirement: SecurityTombola is isolated from route and loader logic
The `SecurityTombola` class SHALL contain no Express, multer, or Memgraph imports. It SHALL accept only a file descriptor object `{ originalname, mimetype, size, buffer }` and perform purely synchronous or local checks.

#### Scenario: SecurityTombola has no framework dependencies
- **WHEN** the SecurityTombola module is imported
- **THEN** it has no dependencies on Express, multer, neo4j-driver, or N3
