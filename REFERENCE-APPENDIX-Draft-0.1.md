# International Rational Calendar — Reference Appendix

**Status:** Draft 0.1, normative companion to [the core specification](SPEC-Draft-0.1.md).  
**Scope:** Text grammar, binary interchange, conversion, arithmetic, and conformance.  
**Short name:** IRC.

This is a project specification written in RFC style, not an IETF RFC. It preserves the core calendar and supplies the previously unspecified wire format and implementation details. The binary profile defined here is named `IRC-A64`.

## A.1. Requirements and conventions

Uppercase requirement words have the meanings defined by [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174). Requirements apply to supported features; implementations MUST document their supported numeric range and optional features. Core text and coordinate conformance requires all five text forms in A.2. Binary interchange and Gregorian conversion are optional, separately claimable features.

All algorithms use exact mathematical integers, including intermediate results. For positive `b`:

```text
floorDiv(a,b) = floor(a / b)
mod(a,b)      = a - b * floorDiv(a,b)
ceilDiv(a,b)  = -floorDiv(-a,b)
```

Thus `floorDiv(-1,128) = -1`, `mod(-1,128) = 127`, and `ceilDiv(-1,128) = 0`. Truncation toward zero is not floor division. Implementations MUST NOT wrap, saturate, round, or lose integer precision. A result outside the supported range MUST fail explicitly. Wider intermediates may be necessary even when the input and result fit a signed 64-bit integer.

`leap(Y)` is true exactly when `mod(Y,4) = 0` and `mod(Y,128) != 0`. Define `e(Y)` as 1 for a leap year and 0 otherwise; `days(Y) = 365 + e(Y)`. Year zero is common. Negative years follow the same rule.

## A.2. Exact text grammar

The following [RFC 5234 ABNF](https://www.rfc-editor.org/rfc/rfc5234) operates on ASCII octets. Numeric terminals enforce uppercase letters without case-insensitive string matching.

```abnf
irc-date     = primary / week-date / ordinal-date
primary      = regular / leap-day / year-day
regular      = year hyphen month hyphen month-day
leap-day     = year hyphen %x4C.44
year-day    = year hyphen %x59.44
week-date    = year hyphen %x57 week hyphen %x4B weekday
ordinal-date = year hyphen %x4F ordinal

year         = 4DIGIT / minus neg-small / minus large / plus large
neg-small    = %x30.30.30 NZDIGIT
             / %x30.30 NZDIGIT DIGIT
             / %x30 NZDIGIT 2DIGIT
             / NZDIGIT 3DIGIT
large        = NZDIGIT 4*DIGIT
month        = %x30 NZDIGIT / %x31 %x30-33
month-day    = %x30 NZDIGIT / %x31 DIGIT / %x32 %x30-38
week         = %x30 NZDIGIT / %x31-34 DIGIT / %x35 %x30-32
weekday      = %x31-37
ordinal      = %x30 %x30 NZDIGIT / %x30 NZDIGIT DIGIT
             / %x31-32 2DIGIT / %x33 %x30-35 DIGIT
             / %x33.36 %x30-36
DIGIT        = %x30-39
NZDIGIT      = %x31-39
hyphen       = %x2D
minus        = %x2D
plus         = %x2B
```

A parser MUST consume the entire input and then validate its semantics. `LD` requires a leap year; ordinal 366 requires a leap year. No other semantic restriction supplements this grammar. In particular, negative zero, redundant year padding, signed positive four-digit years, and unsigned expanded years are excluded by the grammar itself.

There is no leading/trailing whitespace, byte-order mark, newline, terminator, localized digit, Unicode minus, case folding, or implicit field normalization. Transport framing is outside the date value. UTF-8 containers carry the same ASCII bytes. Human display forms such as `Y2026 M08 D17` are outside this grammar.

Serialize years 0–9999 as four digits; negative magnitudes below 10000 as four digits preceded by `-`; all larger magnitudes without leading zeroes, preceded by `-` or `+` as appropriate. Serialize regular dates as `year-MM-DD` and intercalary dates as `year-LD` or `year-YD`.

Normalization means parse, validate, and serialize as `primary`. It MUST NOT repair invalid input. For signatures, hashing, and equality by text, normalize first. Week and ordinal representations retain their canonical year spelling and fixed field widths but are alternative coordinates, not primary serialization.

Calendar identity MUST be established by the enclosing schema or protocol. For example, an IRC field containing `2026-08-17` does not denote the Gregorian date with those fields. This appendix does not register a media type or add a calendar prefix to the core grammar.

## A.3. Coordinate conversion

Validate integer fields before calculating: `1 <= M <= 13`, `1 <= D <= 28`, `1 <= W <= 52`, `1 <= K <= 7`, and `1 <= O <= days(Y)`.

For regular dates:

```text
q = 28*(M-1) + D-1
W = floorDiv(q,7) + 1
K = mod(q,7) + 1
O = q + 1 + (1 if leap(Y) and q >= 196 else 0)
```

From week coordinates:

```text
q = 7*(W-1) + K-1
M = floorDiv(q,28) + 1
D = mod(q,28) + 1
```

For `LeapDay(Y)`, `O = 197`; for `YearDay(Y)`, `O = days(Y)`. The inverse, with tests in the stated order, is:

```text
fromOrdinal(Y,O):
    require 1 <= O <= days(Y)
    if O == days(Y): return YearDay(Y)
    if leap(Y) and O == 197: return LeapDay(Y)
    q = O - 1 - (1 if leap(Y) and O > 197 else 0)
    return Regular(Y, floorDiv(q,28)+1, mod(q,28)+1)
```

Intercalary dates have no month, day-of-month, week, or weekday. Requests for those coordinates MUST report absence or failure, never fabricated numeric coordinates.

## A.4. Absolute day conversion

The epoch is IRC `0000-01-01`, absolute day `A = 0`. Define:

```text
start(Y) = 365*Y + ceilDiv(Y,4) - ceilDiv(Y,128)
toAbsolute(Y,O) = start(Y) + O-1
```

Validate `O` first. This epoch is internal to IRC; it is not the Unix epoch.

Every 128-year cycle contains 46,751 days. The following inverse uses a bounded binary search, requiring at most seven iterations regardless of the magnitude or sign of `A`:

```text
fromAbsolute(A):
    c = floorDiv(A,46751)
    r = mod(A,46751)
    lo = 0
    hi = 128
    while hi-lo > 1:
        mid = floorDiv(lo+hi,2)
        if start(mid) <= r: lo = mid
        else: hi = mid
    Y = 128*c + lo
    O = r - start(lo) + 1
    return fromOrdinal(Y,O)
```

`start(0) = 0`, `start(128) = 46751`, and `start(Y+128) = start(Y)+46751`. These identities establish the search bounds, including for negative input. Any equivalent exact algorithm MAY replace this reference algorithm.

## A.5. Binary interchange: IRC-A64

An IRC-A64 value is exactly eight octets encoding `A` as a signed 64-bit two's-complement integer, most significant octet first. There is no header, padding, separate tag, or stored coordinate. All 2^64 bit patterns denote dates; none is reserved for null, invalid, or missing. The enclosing protocol supplies framing, calendar/profile identity, version, and optionality.

```text
range: -9223372036854775808 <= A <= 9223372036854775807

encode(A):
    require A is an integer within range
    U = A if A >= 0 else A + 2^64
    for i = 0..7:
        octet[i] = mod(floorDiv(U, 2^(8*(7-i))), 256)
    return octet

decode(octet):
    require exactly 8 octets
    U = 0
    for i = 0..7:
        U = 256*U + octet[i]
    return U if U < 2^63 else U - 2^64
```

`decode` yields an absolute day; A.4 recovers the tagged semantic date. Encoding an out-of-range date MUST fail, even if a narrower conversion would wrap into a valid byte sequence. The text model remains unbounded; this binary profile does not restrict the calendar's semantic year domain.

Full IRC-A64 conformance requires every value in this range. An implementation handling only a subset MUST describe itself as a restricted implementation and reject unsupported values. Implementations using JavaScript numbers cannot represent the full range exactly; an exact integer representation is required.

Compare decoded values as signed integers for chronological order. Unsigned lexicographic comparison of these bytes does not order negative and non-negative dates chronologically. Host-native memory layout MUST NOT determine byte order.

## A.6. Proleptic Gregorian conversion

Gregorian coordinates in this section are integer `(g,m,d)` with astronomical year numbering, including year zero. Apply the Gregorian rule proleptically with no historical cutover. Gregorian leap years are divisible by 4, except centuries not divisible by 400. This is the Gregorian rule described in [RFC 3339, Appendix C](https://www.rfc-editor.org/rfc/rfc3339#appendix-C); IRC text is not an RFC 3339 timestamp.

Define a Gregorian day index `G` whose zero is Gregorian `0000-01-01`:

```text
gLeap(g)  = mod(g,4)==0 and (mod(g,100)!=0 or mod(g,400)==0)
gStart(g) = 365*g + ceilDiv(g,4) - ceilDiv(g,100) + ceilDiv(g,400)
lengths(g) = [31, 29 if gLeap(g) else 28, 31, 30, 31, 30,
              31, 31, 30, 31, 30, 31]

gregorianToIndex(g,m,d):
    require 1 <= m <= 12 and 1 <= d <= lengths(g)[m-1]
    return gStart(g) + sum(lengths(g)[0 .. m-2]) + d-1
```

The sum is zero when `m = 1`. Gregorian year zero is leap, unlike IRC year zero. A 400-year Gregorian cycle contains 146,097 days:

```text
gregorianFromIndex(G):
    c = floorDiv(G,146097)
    r = mod(G,146097)
    lo = 0
    hi = 400
    while hi-lo > 1:
        mid = floorDiv(lo+hi,2)
        if gStart(mid) <= r: lo = mid
        else: hi = mid
    g = 400*c + lo
    t = r - gStart(lo)
    m = 1
    while t >= lengths(g)[m-1]:
        t = t - lengths(g)[m-1]
        m = m+1
    return (g,m,t+1)
```

The standard alignment in core section 29 gives:

```text
IRC       2000-01-01: A = 730484
Gregorian 2000-01-01: G = 730485

IRC to Gregorian: gregorianFromIndex(toAbsolute(Y,O) + 1)
Gregorian to IRC: fromAbsolute(gregorianToIndex(g,m,d) - 1)
```

Thus `G = A + 1` and `A = G - 1`. IRC `0000-01-01` corresponds to Gregorian `0000-01-02`. Year boundaries need not coincide because the leap rules differ. Conversion MUST use day indices, including when the resulting year number differs. No time zone, instant, 24-hour duration, or traditional weekday is implied.

## A.7. Exact arithmetic

Inputs and shifts are integers. Validate the source before arithmetic. The following operations define the core behavior without application-specific substitution policies:

```text
addDays(date,n):
    return fromAbsolute(toAbsolute(date.Y, ordinal(date)) + n)

daysBetween(a,b):
    return toAbsolute(b.Y,ordinal(b)) - toAbsolute(a.Y,ordinal(a))

shiftWeeks(Regular(Y,M,D),n):
    q = 28*(M-1) + D-1
    t = 364*Y + q + 7*n
    Y2 = floorDiv(t,364)
    q2 = mod(t,364)
    return Regular(Y2, floorDiv(q2,28)+1, mod(q2,28)+1)

shiftMonths(Regular(Y,M,D),n):
    t = 13*Y + M-1 + n
    return Regular(floorDiv(t,13), mod(t,13)+1, D)

shiftYears(date,n):
    Y2 = date.Y+n
    if date is Regular: return Regular(Y2,date.M,date.D)
    if date is YearDay: return YearDay(Y2)
    require leap(Y2)
    return LeapDay(Y2)
```

`ordinal(date)` is A.3's ordinal projection. Week/month shifts on either intercalary type MUST fail, including a zero shift. Zero day/year shifts are identities on valid dates. A calendar week shift can span eight civil days across an intercalary day; adding seven days is a different operation.

## A.8. Conformance vectors

The fenced records below are normative. Integers are decimal unless labelled hex. `null` means an absent coordinate, not zero. Each conversion row MUST work in both directions; text rows additionally require primary serialization, alternate-coordinate parsing, and exact binary bytes.

### A.8.1. Dates, coordinates, bytes, and Gregorian equivalents

`A` is a decimal string to preserve precision in JSON. `hex` contains eight octets in wire order. Gregorian strings use A.2 year spelling for these vectors only.

```json
[
  {"primary":"-0128-01-01","week":"-0128-W01-K1","ordinal":"-0128-O001","A":"-46751","hex":"ffffffffffff4961","gregorian":"-0128-01-02"},
  {"primary":"-0004-LD","week":null,"ordinal":"-0004-O197","A":"-1265","hex":"fffffffffffffb0f","gregorian":"-0004-07-16"},
  {"primary":"-0001-YD","week":null,"ordinal":"-0001-O365","A":"-1","hex":"ffffffffffffffff","gregorian":"0000-01-01"},
  {"primary":"0000-01-01","week":"0000-W01-K1","ordinal":"0000-O001","A":"0","hex":"0000000000000000","gregorian":"0000-01-02"},
  {"primary":"0000-YD","week":null,"ordinal":"0000-O365","A":"364","hex":"000000000000016c","gregorian":"0000-12-31"},
  {"primary":"0001-01-01","week":"0001-W01-K1","ordinal":"0001-O001","A":"365","hex":"000000000000016d","gregorian":"0001-01-01"},
  {"primary":"0004-LD","week":null,"ordinal":"0004-O197","A":"1656","hex":"0000000000000678","gregorian":"0004-07-15"},
  {"primary":"0128-01-01","week":"0128-W01-K1","ordinal":"0128-O001","A":"46751","hex":"000000000000b69f","gregorian":"0128-01-02"},
  {"primary":"2000-01-01","week":"2000-W01-K1","ordinal":"2000-O001","A":"730484","hex":"00000000000b2574","gregorian":"2000-01-01"},
  {"primary":"2026-08-17","week":"2026-W31-K3","ordinal":"2026-O213","A":"740193","hex":"00000000000b4b61","gregorian":"2026-08-01"},
  {"primary":"2026-YD","week":null,"ordinal":"2026-O365","A":"740345","hex":"00000000000b4bf9","gregorian":"2026-12-31"},
  {"primary":"2028-07-28","week":"2028-W28-K7","ordinal":"2028-O196","A":"740906","hex":"00000000000b4e2a","gregorian":"2028-07-14"},
  {"primary":"2028-LD","week":null,"ordinal":"2028-O197","A":"740907","hex":"00000000000b4e2b","gregorian":"2028-07-15"},
  {"primary":"2028-08-01","week":"2028-W29-K1","ordinal":"2028-O198","A":"740908","hex":"00000000000b4e2c","gregorian":"2028-07-16"},
  {"primary":"2028-13-28","week":"2028-W52-K7","ordinal":"2028-O365","A":"741075","hex":"00000000000b4ed3","gregorian":"2028-12-30"},
  {"primary":"2028-YD","week":null,"ordinal":"2028-O366","A":"741076","hex":"00000000000b4ed4","gregorian":"2028-12-31"},
  {"primary":"2029-01-01","week":"2029-W01-K1","ordinal":"2029-O001","A":"741077","hex":"00000000000b4ed5","gregorian":"2029-01-01"},
  {"primary":"2048-08-01","week":"2048-W29-K1","ordinal":"2048-O197","A":"748212","hex":"00000000000b6ab4","gregorian":"2048-07-15"},
  {"primary":"2048-YD","week":null,"ordinal":"2048-O365","A":"748380","hex":"00000000000b6b5c","gregorian":"2048-12-30"},
  {"primary":"2049-01-01","week":"2049-W01-K1","ordinal":"2049-O001","A":"748381","hex":"00000000000b6b5d","gregorian":"2048-12-31"},
  {"primary":"2100-08-01","week":"2100-W29-K1","ordinal":"2100-O198","A":"767205","hex":"00000000000bb4e5","gregorian":"2100-07-16"},
  {"primary":"2176-01-01","week":"2176-W01-K1","ordinal":"2176-O001","A":"794767","hex":"00000000000c208f","gregorian":"2176-01-01"},
  {"primary":"9999-YD","week":null,"ordinal":"9999-O365","A":"3652420","hex":"000000000037bb44","gregorian":"9999-12-28"},
  {"primary":"+10000-01-01","week":"+10000-W01-K1","ordinal":"+10000-O001","A":"3652421","hex":"000000000037bb45","gregorian":"9999-12-29"},
  {"primary":"-10000-01-01","week":"-10000-W01-K1","ordinal":"-10000-O001","A":"-3652422","hex":"ffffffffffc844ba","gregorian":"-10000-01-05"},
  {"primary":"-25252756533922511-03-10","week":"-25252756533922511-W10-K3","ordinal":"-25252756533922511-O066","A":"-9223372036854775808","hex":"8000000000000000","gregorian":"-25252734927766555-06-07"},
  {"primary":"+25252756533922510-11-20","week":"+25252756533922510-W43-K6","ordinal":"+25252756533922510-O300","A":"9223372036854775807","hex":"7fffffffffffffff","gregorian":"+25252734927766554-07-28"}
]
```

### A.8.2. Invalid text

Every input below MUST be rejected, not repaired. JSON escapes denote the actual characters to test.

```json
[
  "",
  "2026-00-01",
  "2026-14-01",
  "2026-01-00",
  "2026-02-29",
  "2026-W00-K1",
  "2026-W53-K1",
  "2026-W01-K0",
  "2026-W01-K8",
  "2026-O000",
  "2026-O366",
  "2028-O367",
  "2026-LD",
  "2048-LD",
  "0000-LD",
  "-0128-LD",
  "2026-8-17",
  "2026-W1-K1",
  "2026-W01-K01",
  "2026-O01",
  "2028-ld",
  "2026-yd",
  "2026-w01-K1",
  "2026-O001extra",
  " 2026-01-01",
  "2026-01-01 ",
  "2026-01-01\n",
  "2026-01-01\u0000",
  "﻿2026-01-01",
  "２０２６-01-01",
  "−0001-YD",
  "-0000-YD",
  "+0000-YD",
  "+2026-YD",
  "10000-YD",
  "02026-YD",
  "+010000-YD",
  "-00001-YD",
  "2026-01-01T00:00:00Z"
]
```

### A.8.3. Arithmetic and binary rejection

```text
operation                              input                 n    expected
addDays                                2028-07-28            1    2028-LD
addDays                                2028-LD               1    2028-08-01
addDays                                2028-08-01           -1    2028-LD
addDays                                2026-13-28            1    2026-YD
addDays                                2026-YD               1    2027-01-01
addDays                                0000-01-01           -1    -0001-YD
addDays                                2028-LD               0    2028-LD
shiftWeeks                             2028-07-22            1    2028-08-01
addDays                                2028-07-22            7    2028-LD
shiftWeeks                             2026-13-22            1    2027-01-01
shiftWeeks                             0000-01-01           -1    -0001-13-22
shiftMonths                            2028-07-28            1    2028-08-28
shiftMonths                            0000-01-28           -1    -0001-13-28
shiftYears                             2028-LD               4    2032-LD
shiftYears                             2028-LD               1    failure
shiftYears                             2044-LD               4    failure
shiftYears                             2026-YD               1    2027-YD
shiftYears                             2028-08-17           -2    2026-08-17
shiftWeeks / shiftMonths               2028-LD               0    failure
shiftWeeks / shiftMonths               2026-YD               1    failure

daysBetween(2028-07-22, 2028-08-01) = 8
daysBetween(2028-08-01, 2028-07-22) = -8
daysBetween(2026-YD, 2027-01-01) = 1
daysBetween(2028-LD, 2028-LD) = 0

IRC-A64 decode: 0, 7, or 9 octets          -> failure
IRC-A64 encode: A = -9223372036854775809  -> failure
IRC-A64 encode: A =  9223372036854775808  -> failure
Gregorian input: (1900,2,29)              -> failure
Gregorian input: (2000,2,29)              -> valid
Gregorian input: (2100,2,29)              -> failure
```

### A.8.4. Required properties

Implementations MUST satisfy these identities throughout their advertised range, whenever all operands and results are supported:

```text
fromAbsolute(toAbsolute(Y,O)) = fromOrdinal(Y,O)
toAbsolute(fromAbsolute(A)) = A
fromOrdinal(Y,ordinal(date)) = date
monthToWeek(weekToMonth(Y,W,K)) = (Y,W,K)
normalize(normalize(text)) = normalize(text)
decode(encode(A)) = A
encode(decode(bytes)) = bytes
GregorianToIRC(IRCToGregorian(date)) = date
start(Y+1) - start(Y) = days(Y)
start(Y+128) - start(Y) = 46751
```

Here `toAbsolute(date)` denotes the A.3 ordinal projection followed by A.4. Test at least one entire negative and one entire non-negative 128-year cycle, including all 364 regular dates and all intercalary dates per year. Gregorian checks SHOULD cover complete 400-year cycles and explicit year-zero cases. Fixed vectors alone do not establish conformance for all inputs.

The companion check can be run with `bun test test/reference.test.ts`. It verifies the machine-readable vectors and independently enumerates calendar days; it is a reference check, not a production calendar library or a complete certification suite.

## A.9. Robustness and interoperability

Parsers SHOULD enforce documented input-size limits before arbitrary-precision conversion. They MUST distinguish invalid syntax or dates from valid values outside their supported range, though error names and API shapes are implementation-defined. Reject mismatched redundant coordinates as required by core section 21.

A consumer MUST know the calendar before interpreting a date. ASCII similarity does not establish Gregorian compatibility. Treat localized labels as display data. Do not infer time zones, timestamps, or traditional weekdays from IRC coordinates.

No IANA action is requested. `IRC-A64` is a profile identifier within this project; it is not a registered media type. Future incompatible wire formats require distinct profile identification in the enclosing protocol.

SPDX-License-Identifier: CC-BY-SA-4.0
