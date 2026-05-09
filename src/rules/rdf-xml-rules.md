# RDF/XML Format Rules

## 1. Overview

RDF/XML is a syntax, defined by the W3C, to express (i.e., serialize) an RDF graph as an XML
document. It is the oldest official RDF serialization format and remains the primary
exchange syntax for OWL 2.

- **MIME type:** `application/rdf+xml`
- **File extension:** `.rdf` (all lowercase, on all platforms)
- **W3C Recommendation:** RDF 1.1 XML Syntax (25 February 2014)
- **Specification:** https://www.w3.org/TR/rdf-syntax-grammar/

> ⚠️ RDF/XML is the most verbose and complex RDF serialization. For new work, Turtle (`.ttl`)
> is strongly preferred for human authoring. RDF/XML is best reserved for system interoperability,
> legacy tooling, or OWL 2 exchange.

---

## 2. XML Foundation Rules

RDF/XML is valid XML first. All XML rules apply before any RDF/XML rules.

### 2.1 XML Declaration (optional but recommended)
```xml
<?xml version="1.0" encoding="UTF-8"?>
```
- The XML declaration is **optional** but **recommended**
- If omitted, UTF-8 or UTF-16 encoding is assumed
- If included, it must be the very first line of the document

### 2.2 Well-formedness
- The document **must** be well-formed XML
- All elements must be properly opened and closed
- All attribute values must be quoted (single or double quotes)
- `<`, `>`, `&` inside content must be escaped as `&lt;`, `&gt;`, `&amp;`
- `"` inside double-quoted attributes must be escaped as `&quot;`

### 2.3 Character Encoding
- RDF/XML uses the ISO/IEC 10646 (Unicode) character repertoire
- Default encoding is UTF-8
- Encoding must be declared in the XML declaration if not UTF-8 or UTF-16

---

## 3. Document Structure Rules

### 3.1 The Root Element: `rdf:RDF`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:skos="http://www.w3.org/2004/02/skos/core#">
  ...
</rdf:RDF>
```
- The document element is typically `rdf:RDF`
- `rdf:RDF` **must** contain all namespace declarations needed by the document
- `rdf:RDF` **may** be omitted if there is only one top-level node element, but all
  namespace declarations must still be present on that element

### 3.2 Namespace Declarations
- The RDF namespace **must** always be declared:
  `xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"`
- Additional namespaces (e.g., `skos:`, `rdfs:`, `owl:`, `xsd:`) must be declared
  before use
- Namespace prefixes are arbitrary but conventional prefixes (`rdf`, `rdfs`, `skos`,
  `owl`, `xsd`) should be used
- **All attributes must be namespace-qualified** — unqualified attributes (except
  `xml:lang`, `xml:base`, `xml:space`) are deprecated and should not be used in
  new documents

### 3.3 The Striped Syntax Pattern
RDF/XML uses a characteristic alternating "striped" structure:
```
rdf:RDF
  └── Node element       (represents a subject / resource)
        └── Property element   (represents a predicate)
              └── Node element (represents an object / resource)
                    └── Property element
                          └── ...
```
- **Node elements** describe resources (subjects or objects)
- **Property elements** describe predicates (properties of a resource)
- They strictly alternate — a node element contains only property elements,
  and a property element contains at most one node element or a literal

---

## 4. Node Element Rules

A node element represents an RDF resource (subject or object).

### 4.1 `rdf:Description`
The generic node element. Any resource can be described using `rdf:Description`:
```xml
<rdf:Description rdf:about="https://example.org/concept/dog">
  ...
</rdf:Description>
```

### 4.2 Typed Node Elements
A typed node element simultaneously asserts `rdf:type`. These are equivalent:

```xml
<!-- Typed node element (shorthand) -->
<skos:Concept rdf:about="https://example.org/concept/dog">
  ...
</skos:Concept>

<!-- Equivalent longhand using rdf:Description + rdf:type -->
<rdf:Description rdf:about="https://example.org/concept/dog">
  <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
  ...
</rdf:Description>
```

### 4.3 Node Element Attributes

| Attribute | Purpose | Notes |
|---|---|---|
| `rdf:about` | Identifies the resource by IRI | Most common; resolves against base IRI |
| `rdf:ID` | Identifies by fragment identifier | Shorthand for `#name` against base IRI; must be unique in document |
| `rdf:nodeID` | Identifies a blank node | Scoped to the document; must match `[A-Za-z_][A-Za-z0-9_.-]*` |
| `rdf:type` | Asserts a type (as attribute) | Value is a URI reference |
| `xml:lang` | Sets language for string literals | Applies to all contained string literals |
| `xml:base` | Sets base IRI for URI resolution | Overrides document base |

### 4.4 Forbidden Node Element Names
The following **must not** be used as node element names (reserved by RDF/XML):
- `rdf:RDF`, `rdf:ID`, `rdf:about`, `rdf:parseType`, `rdf:resource`,
  `rdf:nodeID`, `rdf:datatype`, `rdf:li`

---

## 5. Property Element Rules

A property element represents a predicate (an arc in the RDF graph).

### 5.1 Basic Property Element with Literal Value
```xml
<skos:prefLabel xml:lang="en">Dog</skos:prefLabel>
```
- The element name is the predicate URI (via namespace prefix)
- Text content becomes a plain literal (with optional `xml:lang`)

### 5.2 Property Element Pointing to a Resource
```xml
<skos:inScheme rdf:resource="https://example.org/scheme/animals"/>
```
- `rdf:resource` attribute holds the object URI — the element must be empty

### 5.3 Property Element with Nested Node
```xml
<skos:broader>
  <skos:Concept rdf:about="https://example.org/concept/mammals"/>
</skos:broader>
```
- A property element may contain exactly one node element as its object

### 5.4 Property Element Attributes

| Attribute | Purpose | Notes |
|---|---|---|
| `rdf:resource` | Object is a URI reference | Element must be empty when used |
| `rdf:nodeID` | Object is a blank node | References or creates a blank node |
| `rdf:datatype` | Typed literal datatype | Value is a datatype URI (e.g., `xsd:integer`) |
| `rdf:parseType` | Changes parsing behaviour | See Section 6 |
| `xml:lang` | Language tag for string literal | Overrides enclosing `xml:lang` |

### 5.5 Property Attributes (shorthand)
Simple plain literal or resource values may be expressed as attributes on a node element
instead of child property elements:
```xml
<skos:Concept rdf:about="https://example.org/concept/dog"
              skos:prefLabel="Dog"/>
```
- Only allowed for **plain literals** (with or without `xml:lang`) or URI references
- **Cannot** be used for: `rdf:li`, `rdf:Description`, typed literals with `rdf:datatype`,
  nested resources, or reified statements

### 5.6 Forbidden Property Element Names
The following **must not** be used as property element names:
- `rdf:RDF`, `rdf:about`, `rdf:ID` (as property), `rdf:nodeID` (as property),
  `rdf:Description`

---

## 6. `rdf:parseType` Rules

`rdf:parseType` changes how the content of a property element is interpreted.

### 6.1 `rdf:parseType="Resource"`
Treats the content as a blank node resource — shorthand for an anonymous nested node:
```xml
<ex:address rdf:parseType="Resource">
  <ex:street>Main Street</ex:street>
  <ex:city>Amsterdam</ex:city>
</ex:address>
```
Equivalent to creating an anonymous blank node with those properties.

### 6.2 `rdf:parseType="Literal"`
Treats the content as an XML literal (an `rdf:XMLLiteral`):
```xml
<ex:description rdf:parseType="Literal">
  <em>This is <strong>bold</strong></em>
</ex:description>
```
- Content is preserved as serialized XML
- Note: `rdf:XMLLiteral` is marked as non-normative in RDF 1.1

### 6.3 `rdf:parseType="Collection"`
Creates an `rdf:List` (linked list structure) from the child node elements:
```xml
<ex:members rdf:parseType="Collection">
  <skos:Concept rdf:about="https://example.org/concept/dog"/>
  <skos:Concept rdf:about="https://example.org/concept/cat"/>
</ex:members>
```
Equivalent to constructing `rdf:first` / `rdf:rest` / `rdf:nil` triples.

---

## 7. IRI and URI Rules

### 7.1 `rdf:about` — Absolute and Relative IRIs
- Values are IRI references, resolved against the in-scope base IRI
- Absolute IRI: `rdf:about="https://example.org/concept/dog"`
- Relative IRI: `rdf:about="#dog"` (resolved against `xml:base` or document location)
- Fragment-only: `rdf:about=""` refers to the document base URI itself

### 7.2 `rdf:ID` — Fragment Identifier Shorthand
```xml
<skos:Concept rdf:ID="dog"> ... </skos:Concept>
```
- Equivalent to `rdf:about="#dog"` resolved against the base IRI
- The value of `rdf:ID` **must be unique** within a single RDF/XML document
- Must match XML NCName syntax: starts with letter or `_`, no spaces

### 7.3 `xml:base` — Base IRI
```xml
<rdf:RDF xml:base="https://example.org/concepts/">
```
- Sets the base IRI for resolving all relative IRIs within scope
- Can be set at document level or on any element
- Follows XML Base specification (RFC 3986 resolution rules)

### 7.4 URN Support
URNs are fully valid IRI values in RDF/XML:
```xml
<rdf:Description rdf:about="urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479">
  ...
</rdf:Description>
```
URNs are not resolved against `xml:base` — they are absolute by definition.

---

## 8. Literal Rules

### 8.1 Plain Literals
Text content of a property element with no `rdf:datatype`:
```xml
<skos:prefLabel>Dog</skos:prefLabel>
```

### 8.2 Language-Tagged Literals
```xml
<skos:prefLabel xml:lang="en">Dog</skos:prefLabel>
<skos:prefLabel xml:lang="nl">Hond</skos:prefLabel>
```
- `xml:lang` is inherited from ancestor elements
- `xml:lang=""` explicitly removes any inherited language tag
- Language tags follow BCP 47 format

### 8.3 Typed Literals
```xml
<ex:count rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">42</ex:count>
```
- `rdf:datatype` value is the datatype URI
- Content is the lexical form of the typed value
- Common datatypes: `xsd:string`, `xsd:integer`, `xsd:decimal`, `xsd:boolean`,
  `xsd:date`, `xsd:dateTime`
- `xml:lang` and `rdf:datatype` **cannot** be used together on the same element

---

## 9. Blank Node Rules

### 9.1 Anonymous Blank Nodes (implicit)
A node element with no `rdf:about`, `rdf:ID`, or `rdf:nodeID` creates an anonymous
blank node:
```xml
<rdf:Description>
  <skos:prefLabel>Anonymous concept</skos:prefLabel>
</rdf:Description>
```

### 9.2 Named Blank Nodes with `rdf:nodeID`
```xml
<rdf:Description rdf:nodeID="b1">
  <skos:prefLabel xml:lang="en">Shared blank node</skos:prefLabel>
</rdf:Description>

<rdf:Description rdf:about="https://example.org/concept/dog">
  <ex:relatedAnonymous rdf:nodeID="b1"/>
</rdf:Description>
```
- `rdf:nodeID` values are scoped to the **document** — not globally unique
- Must match: `[A-Za-z_][A-Za-z0-9._-]*`
- The same `rdf:nodeID` value in multiple places refers to the **same** blank node

---

## 10. Container and Collection Rules

### 10.1 RDF Containers (Bag, Seq, Alt)
```xml
<rdf:Bag>
  <rdf:li rdf:resource="https://example.org/concept/dog"/>
  <rdf:li rdf:resource="https://example.org/concept/cat"/>
</rdf:Bag>
```
- `rdf:li` expands to `rdf:_1`, `rdf:_2`, … in order
- `rdf:Bag` — unordered collection (members may repeat)
- `rdf:Seq` — ordered sequence
- `rdf:Alt` — alternatives (first member is default)
- Containers are **open** — additional members may be added

### 10.2 RDF Collections (closed lists)
```xml
<ex:items rdf:parseType="Collection">
  <rdf:Description rdf:about="https://example.org/concept/dog"/>
  <rdf:Description rdf:about="https://example.org/concept/cat"/>
</ex:items>
```
- Creates a proper `rdf:List` structure using `rdf:first`/`rdf:rest`/`rdf:nil`
- Collections are **closed** — membership is fixed

---

## 11. Reification Rules

Reification allows making statements about statements (triples):
```xml
<rdf:Statement rdf:ID="stmt1">
  <rdf:subject rdf:resource="https://example.org/concept/dog"/>
  <rdf:predicate rdf:resource="http://www.w3.org/2004/02/skos/core#broader"/>
  <rdf:object rdf:resource="https://example.org/concept/mammals"/>
</rdf:Statement>
```
Or via shorthand using `rdf:ID` on a property element:
```xml
<skos:broader rdf:ID="stmt1" rdf:resource="https://example.org/concept/mammals"/>
```
This generates 4 triples: one for the original statement plus three reification triples
(`rdf:subject`, `rdf:predicate`, `rdf:object`).

> ⚠️ Note: RDF 1.2 introduces triple terms as a cleaner alternative to reification.

---

## 12. Complete SKOS Example in RDF/XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#"
  xml:base="https://example.org/animals/">

  <!-- ConceptScheme -->
  <skos:ConceptScheme rdf:about="https://example.org/animals/scheme">
    <skos:prefLabel xml:lang="en">Animal Taxonomy</skos:prefLabel>
    <skos:hasTopConcept rdf:resource="https://example.org/animals/animals"/>
  </skos:ConceptScheme>

  <!-- Top concept -->
  <skos:Concept rdf:about="https://example.org/animals/animals">
    <skos:prefLabel xml:lang="en">Animals</skos:prefLabel>
    <skos:prefLabel xml:lang="nl">Dieren</skos:prefLabel>
    <skos:inScheme rdf:resource="https://example.org/animals/scheme"/>
    <skos:topConceptOf rdf:resource="https://example.org/animals/scheme"/>
    <skos:narrower rdf:resource="https://example.org/animals/mammals"/>
    <skos:narrower rdf:resource="https://example.org/animals/birds"/>
  </skos:Concept>

  <!-- Narrower concept -->
  <skos:Concept rdf:about="https://example.org/animals/mammals">
    <skos:prefLabel xml:lang="en">Mammals</skos:prefLabel>
    <skos:prefLabel xml:lang="nl">Zoogdieren</skos:prefLabel>
    <skos:definition xml:lang="en">Warm-blooded vertebrates with hair.</skos:definition>
    <skos:inScheme rdf:resource="https://example.org/animals/scheme"/>
    <skos:broader rdf:resource="https://example.org/animals/animals"/>
  </skos:Concept>

  <!-- Polyhierarchy: Bats has two broader parents -->
  <skos:Concept rdf:about="https://example.org/animals/bats">
    <skos:prefLabel xml:lang="en">Bats</skos:prefLabel>
    <skos:inScheme rdf:resource="https://example.org/animals/scheme"/>
    <skos:broader rdf:resource="https://example.org/animals/mammals"/>
    <skos:broader rdf:resource="https://example.org/animals/birds"/>
  </skos:Concept>

  <!-- Typed literal -->
  <skos:Concept rdf:about="https://example.org/animals/birds">
    <skos:prefLabel xml:lang="en">Birds</skos:prefLabel>
    <skos:inScheme rdf:resource="https://example.org/animals/scheme"/>
    <skos:broader rdf:resource="https://example.org/animals/animals"/>
    <skos:narrower rdf:resource="https://example.org/animals/bats"/>
  </skos:Concept>

</rdf:RDF>
```

---

## 13. What Is and Is Not Allowed in RDF/XML

| Rule | Allowed? |
|---|---|
| `rdf:RDF` as root element | ✅ Required (or omitted if single top node) |
| `rdf:RDF` omitted with single top-level node | ✅ Yes, but namespaces must stay |
| Multiple `rdf:Description` / typed nodes at top level | ✅ Yes |
| `rdf:about` and `rdf:ID` on the same node element | ❌ No — mutually exclusive |
| `rdf:about` and `rdf:nodeID` on the same node element | ❌ No — mutually exclusive |
| `rdf:resource` and text content on a property element | ❌ No — mutually exclusive |
| `rdf:datatype` and `xml:lang` on the same property element | ❌ No — mutually exclusive |
| Multiple `rdf:parseType` values on one element | ❌ No |
| `rdf:ID` value used more than once in a document | ❌ No — must be unique |
| Relative IRIs without `xml:base` or document base | ⚠️ Resolved against document location |
| Unqualified attributes (no namespace prefix) | ⚠️ Deprecated — do not use in new docs |
| `rdf:li` as a property element inside a container | ✅ Yes |
| `rdf:li` as a node element name | ❌ No |
| Blank nodes as predicates | ❌ No (RDF rule, enforced by RDF/XML) |
| Literals as subjects | ❌ No (RDF rule, enforced by RDF/XML) |
| `xml:lang` on `rdf:RDF` | ✅ Yes — inherited by all descendants |
| Empty property element with `rdf:resource` | ✅ Yes — standard pattern |
| Nested node elements more than one level deep | ✅ Yes — arbitrarily deep |
| URNs as `rdf:about` values | ✅ Yes |

---

## 14. RDF/XML vs Turtle — Quick Comparison

| Feature | RDF/XML | Turtle |
|---|---|---|
| Human readability | ⚠️ Verbose | ✅ Concise |
| XML tooling compatibility | ✅ Full | ❌ None |
| OWL 2 required format | ✅ Yes | ❌ No |
| Namespace declarations | In XML attributes | `@prefix` directives |
| Blank node syntax | `rdf:nodeID` or anonymous element | `[]` shorthand |
| Multiple `rdf:type` | Repeated `rdf:type` elements | Comma-separated after `a` |
| Polyhierarchy | Repeated `skos:broader` elements | Repeated `skos:broader` lines |
| Collections | `rdf:parseType="Collection"` | `( item1 item2 )` |
| Comments | XML `<!-- -->` | `#` line comments |

---

## 15. References

- [RDF 1.1 XML Syntax — W3C Recommendation](https://www.w3.org/TR/rdf-syntax-grammar/)
- [RDF 1.2 XML Syntax — W3C Working Draft](https://www.w3.org/TR/rdf12-xml/)
- [RDF 1.1 Concepts — W3C](https://www.w3.org/TR/rdf11-concepts/)
- [XML 1.0 Specification — W3C](https://www.w3.org/TR/xml/)
- [XML Namespaces — W3C](https://www.w3.org/TR/xml-names/)
- [XML Base — W3C](https://www.w3.org/TR/xmlbase/)
- [RFC 3870 — application/rdf+xml MIME Type](https://www.rfc-editor.org/rfc/rfc3870)
- [Understanding Striped RDF/XML](https://www.w3.org/2001/10/stripes/)
