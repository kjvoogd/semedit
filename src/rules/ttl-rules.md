# Turtle (TTL) Format Rules

## 1. Overview

Turtle (Terse RDF Triple Language) is a textual syntax for RDF that allows an RDF graph
to be completely written in a compact and natural text form, with abbreviations for common
usage patterns and datatypes.

- **MIME type:** `text/turtle`
- **File extension:** `.ttl` (all lowercase, on all platforms)
- **Character encoding:** UTF-8 (always — no other encoding is permitted)
- **W3C Recommendation:** RDF 1.1 Turtle (25 February 2014)
- **Specification:** https://www.w3.org/TR/turtle/

> ✅ Turtle is the **preferred format** for human authoring of RDF and SKOS. It is concise,
> readable, and widely supported across all major RDF toolkits and triplestores.

---

## 2. Document-Level Rules

### 2.1 Encoding
- A Turtle document **must** be encoded in **UTF-8**
- No XML declaration or BOM is required (or expected)
- Unicode characters may be used directly in the file or escaped:
  - `\uXXXX` for code points U+0000 to U+FFFF
  - `\UXXXXXXXX` for code points up to U+10FFFF

### 2.2 Comments
- Comments begin with `#` and continue to the end of the line
- Comments may appear anywhere outside a triple
- There are no block/multi-line comments

```turtle
# This is a comment
<https://example.org/concept> a skos:Concept . # inline comment
```

### 2.3 Whitespace
- Whitespace (spaces, tabs, newlines) between tokens is **insignificant**
- Whitespace is used for readability only — no indentation rules apply
- A Turtle document may legally be written on a single line

---

## 3. Prefix and Base Directives

Directives must appear **outside** of triples. They may appear anywhere in the document
(not just at the top), and take effect from that point forward.

### 3.1 `@prefix` — Namespace Declaration

```turtle
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix ex:   <https://example.org/> .
```

- `@prefix` is **case-sensitive** — must be lowercase `@prefix`
- The prefix label (e.g., `rdf`, `skos`) may be empty: `@prefix : <...> .` (default prefix)
- The IRI must be enclosed in `<` and `>`
- The directive **must** end with a `.` (full stop)
- Subsequent `@prefix` directives **may re-map** the same prefix label — the last
  declaration wins for all subsequent uses

### 3.2 `PREFIX` — SPARQL-style Namespace Declaration (alternative)

```turtle
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX ex:   <https://example.org/>
```

- `PREFIX` is **case-insensitive** — `prefix`, `PREFIX`, `Prefix` are all valid
- Does **not** end with a `.` (no trailing full stop)
- Functionally identical to `@prefix`
- Added to align Turtle with SPARQL syntax

### 3.3 `@base` — Base IRI Declaration

```turtle
@base <https://example.org/concepts/> .
```

- Sets the base IRI for resolving all **relative IRI references** that follow
- May appear multiple times — each occurrence changes the base IRI from that point
- Must end with a `.`
- `BASE` (no `@`, case-insensitive) is the SPARQL-aligned alternative — no trailing `.`

```turtle
BASE <https://example.org/concepts/>
```

---

## 4. Triple Syntax Rules

Every triple ends with a **full stop** `.`. This is mandatory.

### 4.1 Simple Triple

```turtle
subject predicate object .
```

```turtle
<https://example.org/concept/dog> skos:prefLabel "Dog"@en .
```

### 4.2 Predicate List — `;` Separator

The `;` repeats the **subject**, allowing multiple predicate-object pairs for the same
subject. These two forms are equivalent:

```turtle
# Predicate list (compact)
<https://example.org/concept/dog>
    skos:prefLabel "Dog"@en ;
    skos:prefLabel "Hond"@nl ;
    skos:definition "A domesticated carnivorous mammal."@en ;
    skos:inScheme <https://example.org/scheme/animals> .

# Equivalent expanded form
<https://example.org/concept/dog> skos:prefLabel "Dog"@en .
<https://example.org/concept/dog> skos:prefLabel "Hond"@nl .
<https://example.org/concept/dog> skos:definition "A domesticated carnivorous mammal."@en .
<https://example.org/concept/dog> skos:inScheme <https://example.org/scheme/animals> .
```

- A trailing `;` before the final `.` is **permitted** (optional)
- Each predicate-object pair is separated by `;`
- The block is closed with `.`

### 4.3 Object List — `,` Separator

The `,` repeats the **subject and predicate**, allowing multiple objects for the same
subject-predicate pair:

```turtle
<https://example.org/concept/dog>
    skos:narrower
        <https://example.org/concept/hound> ,
        <https://example.org/concept/working-dog> .
```

- `,` and `;` may be combined freely in the same triple block
- A trailing `,` before `;` or `.` is **permitted** (optional)

### 4.4 Combining `;` and `,`

```turtle
<https://example.org/concept/bats>
    a skos:Concept ;
    skos:prefLabel "Bats"@en, "Vleermuizen"@nl ;
    skos:broader
        <https://example.org/concept/mammals> ,
        <https://example.org/concept/birds> ;
    skos:inScheme <https://example.org/scheme/animals> .
```

---

## 5. IRI Rules

### 5.1 Absolute IRIs
Enclosed in `<` and `>`:
```turtle
<https://example.org/concept/dog>
<urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479>
```
- HTTP(S) URLs and URNs are both valid
- IRIs **must not** contain spaces
- Special characters must be percent-encoded or Unicode-escaped

### 5.2 Relative IRIs
Resolved against the in-scope `@base` IRI:
```turtle
@base <https://example.org/concepts/> .

<dog>    # resolves to https://example.org/concepts/dog
<#dog>   # resolves to https://example.org/concepts/#dog
<>       # resolves to the base IRI itself
```

### 5.3 Prefixed Names
```turtle
skos:Concept       # expands to http://www.w3.org/2004/02/skos/core#Concept
ex:dog             # expands to the IRI associated with prefix ex: + "dog"
:dog               # uses the default (empty) prefix
```

Prefixed name local parts may contain:
- Leading digits: `leg:3032571`
- Non-leading colons: `og:video:height`
- Dots in non-first/non-last position: `ex:first.name`
- Reserved character escapes: `wgs:lat\-long`

### 5.4 The `a` Keyword
In **predicate position only**, `a` is shorthand for `rdf:type`:
```turtle
<https://example.org/concept/dog> a skos:Concept .
# equivalent to:
<https://example.org/concept/dog> rdf:type skos:Concept .
```
- `a` is **case-sensitive** — must be lowercase
- `a` is only valid as a predicate — not as a subject or object

---

## 6. Literal Rules

### 6.1 Plain String Literals

Single-quoted or double-quoted:
```turtle
"Dog"
'Dog'
```
- Both single and double quotes are valid
- Strings must not contain unescaped `"` (or `'` for single-quoted) or newlines

### 6.2 Long (Multi-line) String Literals

Triple-quoted strings allow newlines and embedded quotes:
```turtle
"""This is a
multi-line string."""

'''Another
multi-line string.'''
```

### 6.3 Language-Tagged Literals

```turtle
skos:prefLabel "Dog"@en .
skos:prefLabel "Hond"@nl .
skos:prefLabel "Chien"@fr .
skos:prefLabel "中文"@zh-Hans .
```

- Language tag follows `@` immediately after the closing quote
- Tags follow **BCP 47** format (e.g., `en`, `nl`, `zh-Hans`, `pt-BR`)
- Language tags are **case-insensitive** in matching but conventionally lowercase
- **Cannot** be combined with `^^` datatype on the same literal

### 6.4 Typed Literals

```turtle
"42"^^xsd:integer
"3.14"^^xsd:decimal
"true"^^xsd:boolean
"2024-01-01"^^xsd:date
"Hello"^^xsd:string
```

- `^^` separates the lexical value from the datatype IRI
- The datatype IRI may be a prefixed name or an absolute IRI
- `xsd:string` is the default type for plain literals with no `@lang` or `^^`
  (in RDF 1.1, a plain literal is equivalent to `^^xsd:string`)

### 6.5 Numeric Literal Shortcuts

```turtle
42          # xsd:integer
3.14        # xsd:decimal
3.14e0      # xsd:double
```

Numeric literals do not require quotes or `^^` — the type is inferred from the form:
- Digits only → `xsd:integer`
- Digits with `.` → `xsd:decimal`
- Digits with `e`/`E` exponent → `xsd:double`

### 6.6 Boolean Literal Shortcuts

```turtle
true        # xsd:boolean (case-sensitive — True/TRUE are invalid in Turtle)
false       # xsd:boolean
```

### 6.7 Escape Sequences in Strings

| Escape | Character |
|---|---|
| `\\` | Backslash `\` |
| `\"` | Double quote `"` |
| `\'` | Single quote `'` |
| `\n` | Newline (U+000A) |
| `\r` | Carriage return (U+000D) |
| `\t` | Tab (U+0009) |
| `\uXXXX` | Unicode code point (4 hex digits) |
| `\UXXXXXXXX` | Unicode code point (8 hex digits) |

---

## 7. Blank Node Rules

### 7.1 Labeled Blank Nodes

```turtle
_:b1 skos:prefLabel "Anonymous"@en .

<https://example.org/concept/dog> ex:relatedTo _:b1 .
```

- Prefix `_:` followed by a valid blank node label
- Label must match: `[A-Za-z_][A-Za-z0-9._-]*` (with some restrictions on `.` and `-`)
- Blank node labels are **scoped to the document** — not globally unique
- The same label in the same document always refers to the same blank node

### 7.2 Anonymous Blank Nodes — `[]`

```turtle
# As a subject
[] skos:prefLabel "Anonymous concept"@en .

# As an object (nested resource)
<https://example.org/concept/dog> ex:address [
    ex:street "Main Street" ;
    ex:city "Amsterdam"
] .
```

- `[]` creates a new anonymous blank node each time it appears (unless it contains properties)
- When `[propertyList]` is used, it is syntactic sugar for a blank node with those properties

### 7.3 Blank Nodes as Subjects vs Objects

```turtle
# Valid: blank node as subject
[] a skos:Concept .

# Valid: blank node as object
<https://example.org/scheme> skos:hasTopConcept [] .

# Invalid: blank node as predicate (RDF rule)
# <subject> [] <object> .   ← NOT valid
```

---

## 8. Collection Rules

The `(...)` syntax creates an `rdf:List` (linked list):

```turtle
ex:myProperty ( ex:item1 ex:item2 ex:item3 ) .
```

Expands to the equivalent of:
```turtle
ex:myProperty _:b0 .
_:b0 rdf:first ex:item1 ; rdf:rest _:b1 .
_:b1 rdf:first ex:item2 ; rdf:rest _:b2 .
_:b2 rdf:first ex:item3 ; rdf:rest rdf:nil .
```

- Collections may appear in **subject or object position**
- An empty collection `()` is shorthand for `rdf:nil`
- Collections may be nested: `( ex:a ( ex:b ex:c ) )`
- Collection items may be any valid RDF term: IRI, blank node, or literal

---

## 9. Formatting Conventions (Best Practices)

Although whitespace is insignificant, the following conventions are widely adopted:

### 9.1 Prefix Declarations at the Top
Place all `@prefix` declarations at the top of the file, before any triples.

### 9.2 One Triple Block per Resource
Group all properties of a resource into one predicate list, terminated by `.`:
```turtle
<https://example.org/concept/dog>
    a skos:Concept ;
    skos:prefLabel "Dog"@en, "Hond"@nl ;
    skos:broader <https://example.org/concept/mammals> ;
    skos:inScheme <https://example.org/scheme/animals> .
```

### 9.3 Indentation
Indent predicate-object pairs by 4 spaces (or 1 tab) for readability.

### 9.4 Alignment
Align predicate-object pairs vertically when a resource has many properties.

### 9.5 Ordering Conventions
Common ordering within a resource's predicate list:
1. `a` (type) first
2. Labels (`skos:prefLabel`, `skos:altLabel`)
3. Documentation (`skos:definition`, `skos:scopeNote`)
4. Hierarchy (`skos:broader`, `skos:narrower`)
5. Associations (`skos:related`)
6. Scheme membership (`skos:inScheme`, `skos:topConceptOf`)
7. Mappings (`skos:exactMatch`, etc.)

---

## 10. What Is and Is Not Allowed

| Rule | Allowed? |
|---|---|
| UTF-8 encoding | ✅ Required |
| Other encodings (UTF-16, Latin-1, etc.) | ❌ No |
| `@prefix` anywhere in the document (not just top) | ✅ Yes |
| Re-mapping a prefix label with a later `@prefix` | ✅ Yes |
| `@prefix` without trailing `.` | ❌ No |
| `PREFIX` without trailing `.` | ✅ Yes (SPARQL form) |
| `a` as subject or object | ❌ No — predicate only |
| `true` / `True` / `TRUE` as boolean | ✅ / ❌ / ❌ — case-sensitive |
| Blank node as predicate | ❌ No (RDF rule) |
| Literal as subject | ❌ No (RDF rule) |
| Relative IRI without `@base` | ⚠️ Resolved against document location (may be undefined) |
| Same `_:label` in the document referring to the same blank node | ✅ Yes |
| Same `_:label` across documents referring to the same blank node | ❌ No — labels are document-scoped |
| Trailing `;` or `,` before `.` | ✅ Yes — permitted |
| Multi-line strings with `"""` or `'''` | ✅ Yes |
| Numeric literals without quotes | ✅ Yes (`42`, `3.14`, `1.0e3`) |
| `@lang` and `^^datatype` on the same literal | ❌ No |
| Collections as predicate | ❌ No — subject or object only |
| Nested collections | ✅ Yes |
| Empty prefix `@prefix : <...> .` | ✅ Yes — the default prefix |
| Unicode characters directly in strings | ✅ Yes |

---

## 11. Complete SKOS Example in Turtle

```turtle
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix ex:   <https://example.org/animals/> .

@base <https://example.org/animals/> .

# ── ConceptScheme ────────────────────────────────────────────────────────────

ex:scheme
    a skos:ConceptScheme ;
    skos:prefLabel "Animal Taxonomy"@en ,
                   "Dierentaxonomie"@nl ;
    skos:hasTopConcept ex:animals .

# ── Top Concept ───────────────────────────────────────────────────────────────

ex:animals
    a skos:Concept ;
    skos:prefLabel "Animals"@en , "Dieren"@nl ;
    skos:definition "Living organisms that are not plants or fungi."@en ;
    skos:inScheme ex:scheme ;
    skos:topConceptOf ex:scheme ;
    skos:narrower ex:mammals , ex:birds , ex:reptiles .

# ── Narrower Concepts ────────────────────────────────────────────────────────

ex:mammals
    a skos:Concept ;
    skos:prefLabel "Mammals"@en , "Zoogdieren"@nl ;
    skos:definition "Warm-blooded vertebrates characterised by hair."@en ;
    skos:scopeNote "Includes aquatic mammals such as whales."@en ;
    skos:inScheme ex:scheme ;
    skos:broader ex:animals ;
    skos:narrower ex:dogs , ex:cats , ex:whales , ex:bats .

ex:birds
    a skos:Concept ;
    skos:prefLabel "Birds"@en , "Vogels"@nl ;
    skos:definition "Warm-blooded vertebrates with feathers and wings."@en ;
    skos:inScheme ex:scheme ;
    skos:broader ex:animals ;
    skos:narrower ex:penguins , ex:bats .

ex:reptiles
    a skos:Concept ;
    skos:prefLabel "Reptiles"@en ;
    skos:inScheme ex:scheme ;
    skos:broader ex:animals .

# ── Polyhierarchy: Bats has two broader parents ───────────────────────────────

ex:bats
    a skos:Concept ;
    skos:prefLabel "Bats"@en , "Vleermuizen"@nl ;
    skos:altLabel "Chiroptera"@en ;
    skos:definition "The only mammals capable of sustained flight."@en ;
    skos:inScheme ex:scheme ;
    skos:broader ex:mammals ;   # first broader
    skos:broader ex:birds .     # second broader — polyhierarchy

# ── Leaf Concepts ─────────────────────────────────────────────────────────────

ex:dogs
    a skos:Concept ;
    skos:prefLabel "Dogs"@en , "Honden"@nl ;
    skos:inScheme ex:scheme ;
    skos:broader ex:mammals .

ex:cats
    a skos:Concept ;
    skos:prefLabel "Cats"@en , "Katten"@nl ;
    skos:inScheme ex:scheme ;
    skos:broader ex:mammals .

ex:whales
    a skos:Concept ;
    skos:prefLabel "Whales"@en , "Walvissen"@nl ;
    skos:inScheme ex:scheme ;
    skos:broader ex:mammals ;
    skos:exactMatch <https://www.wikidata.org/entity/Q7365> .  # cross-scheme mapping

ex:penguins
    a skos:Concept ;
    skos:prefLabel "Penguins"@en , "Pinguïns"@nl ;
    skos:inScheme ex:scheme ;
    skos:broader ex:birds .
```

---

## 12. Turtle vs RDF/XML — Quick Comparison

| Feature | Turtle | RDF/XML |
|---|---|---|
| Human readability | ✅ Concise | ⚠️ Verbose |
| Default format for SKOS authoring | ✅ Yes | ❌ No |
| OWL 2 required format | ❌ No | ✅ Yes |
| Encoding | UTF-8 only | Declared in XML header |
| Namespace declarations | `@prefix` directives | `xmlns:` attributes on root |
| Type shorthand | `a` keyword | Typed node elements |
| Multiple objects | `,` separator | Repeated property elements |
| Multiple predicates | `;` separator | Multiple child elements |
| Blank nodes | `[]` or `_:label` | Anonymous element or `rdf:nodeID` |
| Collections | `( item1 item2 )` | `rdf:parseType="Collection"` |
| Comments | `# line comment` | `<!-- XML comment -->` |
| Multi-line strings | `"""..."""` | Text content of element |
| Typed literals | `"val"^^xsd:type` | `rdf:datatype` attribute |
| Base IRI | `@base` directive | `xml:base` attribute |
| XML tooling support | ❌ None | ✅ Full |
| SPARQL syntax similarity | ✅ High | ❌ None |

---

## 13. Turtle vs N-Triples — Quick Comparison

N-Triples is the simplest RDF serialization — one triple per line, no abbreviations.
Turtle is a strict superset of N-Triples.

| Feature | Turtle | N-Triples |
|---|---|---|
| File extension | `.ttl` | `.nt` |
| Prefixes | ✅ Yes | ❌ No — full IRIs only |
| `a` shorthand | ✅ Yes | ❌ No |
| Predicate/object lists | ✅ Yes | ❌ No |
| Blank node `[]` syntax | ✅ Yes | ❌ No |
| Collections `()` | ✅ Yes | ❌ No |
| Human readable | ✅ Yes | ⚠️ Verbose |
| Streaming / line-based | ❌ No | ✅ Yes |
| Fastest to parse | ❌ No | ✅ Yes |

---

## 14. References

- [RDF 1.1 Turtle — W3C Recommendation](https://www.w3.org/TR/turtle/)
- [RDF 1.2 Turtle — W3C Working Draft](https://www.w3.org/TR/rdf12-turtle/)
- [RDF 1.1 Concepts — W3C](https://www.w3.org/TR/rdf11-concepts/)
- [BCP 47 Language Tags](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
- [XML Schema Datatypes (xsd:)](https://www.w3.org/TR/xmlschema11-2/)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [N-Triples Format](https://www.w3.org/TR/n-triples/)
