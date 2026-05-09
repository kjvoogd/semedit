### Requirement: Logger supports four severity levels
The system SHALL provide a logger with levels `error`, `info`, `debug`, and `trace` in ascending verbosity order. Only messages at or above the configured level SHALL be emitted.

#### Scenario: Message at active level is emitted
- **WHEN** the logger level is `info` and `logger.info(...)` is called
- **THEN** the message is written to the browser console

#### Scenario: Message below active level is suppressed
- **WHEN** the logger level is `info` and `logger.debug(...)` is called
- **THEN** nothing is written to the console

#### Scenario: Error level is always emitted at default config
- **WHEN** the logger level is `info` (default) and `logger.error(...)` is called
- **THEN** the message is written to the console via `console.error`

### Requirement: File import events are logged at info level
The system SHALL log a single `info`-level message when a Turtle file is successfully imported, including the filename, file size in bytes, detected vocabulary type (`skos` or `pcicore`), and the number of root nodes produced.

#### Scenario: Successful SKOS import
- **WHEN** a valid SKOS Turtle file is imported
- **THEN** an `info` log entry is written containing the filename, byte size, vocabulary `skos`, and root node count

#### Scenario: Successful pcicore import
- **WHEN** a valid pcicore Turtle file is imported
- **THEN** an `info` log entry is written containing the filename, byte size, vocabulary `pcicore`, and root node count

### Requirement: Import parse errors are logged at error level
The system SHALL log an `error`-level message when Turtle parsing fails, including the filename and the error message.

#### Scenario: Invalid Turtle triggers error log
- **WHEN** a file with invalid Turtle syntax is imported
- **THEN** an `error` log entry is written containing the filename and the parse error message

### Requirement: Internal parse steps are logged at debug level
The system SHALL log `debug`-level messages for significant internal steps in `parseTurtle`: prefix injection (listing injected prefixes) and vocabulary detection (which predicates triggered which branch).

#### Scenario: Missing prefix injection logged
- **WHEN** `parseTurtle` injects one or more missing prefixes
- **THEN** a `debug` log entry lists the injected prefix names

#### Scenario: Vocabulary branch selection logged
- **WHEN** `parseTurtle` selects the SKOS or pcicore branch
- **THEN** a `debug` log entry identifies which vocabulary was detected
