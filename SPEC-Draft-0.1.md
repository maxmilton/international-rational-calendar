# International Rational Calendar Specification

**Status:** Draft 0.1
**Scope:** Civil calendar dates and their representation.

**Normative companion:** [Reference appendix: grammar, binary encoding, algorithms, and conformance vectors](REFERENCE-APPENDIX-Draft-0.1.md).

The International Rational Calendar is a fixed solar calendar consisting of thirteen equal months, fifty-two equal weeks, and one or two intercalary days per year.

Its primary design goals are:

1. **Structural regularity**
2. **Simple arithmetic**
3. **Unambiguous semantics**
4. **Collision-free notation**
5. **Separation of data from presentation**
6. **Multiple equivalent coordinate systems**
7. **Minimal stored state**
8. **International localization without structural variation**

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** indicate normative requirements.

---

# 1. Core principles

## 1.1 Semantic structure is universal

Calendar structure MUST NOT vary by language, country, culture, or locale.

Localization MAY alter:

- labels
- typography
- pronunciation
- descriptive names

Localization MUST NOT alter:

- month order
- week order
- weekday order
- numeric identity
- leap rules
- date arithmetic
- canonical representation semantics

In particular:

> **Localization affects labels, not semantics or structure.**

---

## 1.2 Semantic, interchange, and display layers are separate

Every implementation SHOULD distinguish three layers.

### Semantic layer

The actual calendar value:

```text
year  = 2026
month = 8
day   = 17
```

### Canonical interchange layer

A language-independent encoding:

```text
2026-08-17
```

### Localized display layer

Human-facing representations:

```text
2026 Month 8 Day 17
2026년 8월 17일
2026年8月17日
```

Localized strings MUST NOT be treated as canonical data.

---

## 1.3 Symbols have one meaning

The calendar reserves:

| Symbol | Meaning                        |
| ------ | ------------------------------ |
| `Y`    | year                           |
| `M`    | month of year                  |
| `D`    | day of month                   |
| `W`    | week of year                   |
| `K`    | weekday / position within week |
| `O`    | ordinal day of year            |

A symbol MUST NOT be reused for another calendar concept.

`K` is intentionally an assigned symbol rather than an English abbreviation. It has no language-specific semantic meaning.

---

# 2. Year structure

A regular year contains:

```text
13 × 28 = 364 regular days
+ 1 Year Day
= 365 civil days
```

A leap year contains:

```text
13 × 28 = 364 regular days
+ 1 Leap Day
+ 1 Year Day
= 366 civil days
```

The regular calendar grid therefore satisfies the identity:

```text
13 × 28 = 52 × 7 = 364
```

This identity is a fundamental invariant of the calendar.

---

# 3. Months

Every year contains exactly thirteen months:

```text
M01 .. M13
```

Every month contains exactly twenty-eight regular days:

```text
D01 .. D28
```

Every month contains exactly four weeks.

No month is longer or shorter than another.

There is no equivalent of Gregorian February.

The canonical month identity is ordinal:

```text
M01 = first month
M02 = second month
...
M13 = thirteenth month
```

Month numbers describe position rather than arbitrary names.

---

# 4. Weeks

Every year contains exactly fifty-two regular weeks:

```text
W01 .. W52
```

Every week contains exactly seven regular weekdays:

```text
K1 .. K7
```

Weeks never overlap adjacent years.

Therefore:

```text
W01 begins at M01 D01
W52 ends   at M13 D28
```

There is no ISO-style week-year ambiguity.

The week containing `M01 D01` is always `W01`.

---

# 5. Weekdays

`K` identifies ordinal position within a week:

```text
K1
K2
K3
K4
K5
K6
K7
```

`K1` is universally the first weekday.

`K7` is universally the seventh weekday.

A locale MUST NOT reorder them.

For example, a locale MAY label the same semantic values as:

```text
K1  Monday       월       月       一
K2  Tuesday      화       火       二
K3  Wednesday    수       水       三
K4  Thursday     목       木       四
K5  Friday       금       金       五
K6  Saturday     토       土       六
K7  Sunday       일       日       七
```

These are aliases only.

The semantic identity remains `K1..K7`.

Traditional weekday labels do not imply equivalence to the weekday assigned to the same physical day by another calendar.

---

# 6. Fixed month/week relationship

Every month begins on `K1` and ends on `K7`.

The structure of every month is therefore:

```text
        K1 K2 K3 K4 K5 K6 K7
week 1  01 02 03 04 05 06 07
week 2  08 09 10 11 12 13 14
week 3  15 16 17 18 19 20 21
week 4  22 23 24 25 26 27 28
```

The corresponding annual weeks are:

```text
M01 → W01..W04
M02 → W05..W08
M03 → W09..W12
...
M13 → W49..W52
```

No separate "week of month" field is required because it is trivially derived.

---

# 7. Intercalary days

Two special date types exist:

```text
LD = Leap Day
YD = Year Day
```

They are **intercalary dates**, not regular dates.

They have:

```text
Y
O
```

but do not have:

```text
M
D
W
K
```

An implementation MUST NOT invent values such as:

```text
M13 D29
W52 K8
M00
K0
```

to represent an intercalary day.

---

## 7.1 Year Day

Every year ends with Year Day.

The sequence is:

```text
M13 D28 / W52 K7
YD
next year M01 D01 / W01 K1
```

Year Day does not belong to a month or week.

It does not advance the `K1..K7` sequence.

---

## 7.2 Leap Day

Leap years contain Leap Day between `M07` and `M08`.

The sequence is:

```text
M07 D28 / W28 K7
LD
M08 D01 / W29 K1
```

Leap Day does not belong to either month.

It does not belong to a week.

It does not advance the `K1..K7` sequence.

---

# 8. Leap years

A year is a leap year when:

```text
Y is divisible by 4
AND
Y is not divisible by 128
```

Equivalent pseudocode:

```text
leap(Y) = Y % 4 == 0 && Y % 128 != 0
```

Examples:

```text
2026  common
2028  leap
2032  leap
2048  common
2176  common
```

The rule applies proleptically to all integer years.

Year zero is divisible by 128 and is therefore a common year.

The mean calendar year is:

```text
365 + 31 / 128
= 365.2421875 days
```

The leap rule is part of the calendar identity and MUST NOT be dynamically changed to follow astronomical observations.

A future calendar using a different leap rule would constitute a different calendar version.

---

# 9. Year numbering

Years are signed integers.

There is a year zero.

The sequence is:

```text
...
Y-2
Y-1
Y0
Y1
Y2
...
```

Historical era labels such as BCE, CE, BC, AD, or local equivalents are presentation concerns only.

Arithmetic MUST use integer year numbering.

---

# 10. Semantic date model

A date has one of three semantic forms:

```text
RegularDate {
    Y
    M
    D
}

LeapDay {
    Y
}

YearDay {
    Y
}
```

Conceptually:

```text
Date =
    RegularDate
  | LeapDay
  | YearDay
```

`LeapDay(Y)` is valid only when `leap(Y)` is true.

This tagged model is normative.

Intercalary days MUST NOT be represented internally as malformed regular dates.

---

# 11. Derived coordinates

Regular dates have two equivalent coordinate systems.

## 11.1 Month coordinates

```text
(Y, M, D)
```

Example:

```text
Y2026 M08 D17
```

## 11.2 Week coordinates

```text
(Y, W, K)
```

The same date is:

```text
Y2026 W31 K3
```

Thus:

```text
(Y, M, D) ↔ (Y, W, K)
```

is a bijection for every regular date.

This allows the coordinate system most appropriate to the domain to be selected without changing the underlying date.

Examples:

```text
civil events       → Y/M/D
project planning   → Y/W/K
annual statistics  → Y/O
```

---

# 12. Month/week conversion

For a regular date, define the zero-based regular-day index:

```text
q = (M - 1) × 28 + (D - 1)
```

where:

```text
0 ≤ q ≤ 363
```

Then:

```text
W = floor(q / 7) + 1
K = (q mod 7) + 1
```

Example:

```text
M08 D17

q = 7 × 28 + 16
  = 212

W = floor(212 / 7) + 1
  = 31

K = (212 mod 7) + 1
  = 3
```

Therefore:

```text
Y2026 M08 D17
=
Y2026 W31 K3
```

---

# 13. Week/month inverse conversion

Given:

```text
W01..W52
K1..K7
```

calculate:

```text
q = (W - 1) × 7 + (K - 1)
```

then:

```text
M = floor(q / 28) + 1
D = (q mod 28) + 1
```

No lookup tables are required in either direction.

---

# 14. Ordinal coordinates

Every civil date, including intercalary dates, has an ordinal day of year:

```text
O001 .. O365
```

or in a leap year:

```text
O001 .. O366
```

Unlike `M/D` and `W/K`, ordinal coordinates cover every date.

Thus:

```text
(Y, O)
```

is a complete coordinate system.

---

## 14.1 Common year

For regular dates:

```text
O = (M - 1) × 28 + D
```

Therefore:

```text
M01 D01 → O001
M07 D28 → O196
M08 D01 → O197
M13 D28 → O364
YD      → O365
```

---

## 14.2 Leap year

In a leap year:

```text
M01 D01 → O001
...
M07 D28 → O196
LD      → O197
M08 D01 → O198
...
M13 D28 → O365
YD      → O366
```

For a regular date:

```text
r = (M - 1) × 28 + D
```

then:

```text
O = r                  if M ≤ 7
O = r + 1              if M ≥ 8 and leap(Y)
```

---

# 15. Fundamental coordinate model

The calendar therefore provides three useful views:

```text
Civil:
    Y / M / D

Planning:
    Y / W / K

Ordinal:
    Y / O
```

Their domains are:

| Coordinate | Regular dates | Leap Day | Year Day |
| ---------- | ------------: | -------: | -------: |
| `Y/M/D`    |           yes |       no |       no |
| `Y/W/K`    |           yes |       no |       no |
| `Y/O`      |           yes |      yes |      yes |

`Y/O` is the complete coordinate system.

`Y/M/D` and `Y/W/K` are structured projections over the 364-day regular grid.

---

# 16. Canonical interchange

## 16.1 Regular date

The canonical representation of a regular date is:

```text
YYYY-MM-DD
```

Example:

```text
2026-08-17
```

Month and day MUST contain exactly two digits.

---

## 16.2 Leap Day

Canonical representation:

```text
YYYY-LD
```

Example:

```text
2028-LD
```

This representation is invalid for a common year.

---

## 16.3 Year Day

Canonical representation:

```text
YYYY-YD
```

Example:

```text
2026-YD
```

---

# 17. Year encoding

Years `0..9999` use exactly four digits:

```text
0000
0001
2026
9999
```

Negative years use `-` followed by an absolute value padded to at least four digits:

```text
-0001
-0123
-10000
```

Years greater than `9999` use `+` followed by the full decimal value:

```text
+10000
+123456
```

Canonical encodings MUST use ASCII digits.

Canonical symbolic tokens MUST use uppercase ASCII.

Whitespace is not permitted inside canonical representations.

---

# 18. Standard coordinate notation

Week-coordinate notation is:

```text
YYYY-Www-Kk
```

Examples:

```text
2026-W01-K1
2026-W31-K3
2026-W52-K7
```

`W` uses exactly two digits.

`K` uses exactly one digit.

Ordinal-coordinate notation is:

```text
YYYY-Oddd
```

Examples:

```text
2026-O001
2026-O213
2026-O365
2028-O366
```

`O` uses exactly three digits.

These are standardized coordinate representations.

For normalization, a date SHOULD be converted to its primary canonical form:

```text
regular → YYYY-MM-DD
LD      → YYYY-LD
YD      → YYYY-YD
```

Systems performing hashing, signatures, equality-by-text, or deterministic serialization MUST normalize before comparison.

---

# 19. Ordering

Dates have a total chronological order.

Within a year, order is defined by `O`.

Across years:

```text
(Y1, O1) < (Y2, O2)
```

when:

```text
Y1 < Y2
```

or:

```text
Y1 == Y2 and O1 < O2
```

Implementations MUST compare semantic values rather than localized strings.

---

# 20. Absolute day index

Implementations MAY represent a date internally as a single signed integer day index.

Define:

```text
ceildiv(a, b) = mathematical ceiling of a / b
```

The number of leap days preceding year `Y`, relative to the start of year zero, is:

```text
L(Y) = ceildiv(Y, 4) - ceildiv(Y, 128)
```

Define absolute day index:

```text
A(Y, O) =
    365 × Y
  + L(Y)
  + O
  - 1
```

Therefore:

```text
A(0, 1) = 0
```

and:

```text
difference_in_days(a, b) = A(b) - A(a)
```

This provides a compact representation suitable for:

- databases
- indexing
- sorting
- arithmetic
- telemetry
- range operations

Derived values such as `M`, `D`, `W`, and `K` need not be stored.

---

# 21. Derived data

For a regular date, the minimal semantic information is:

```text
Y
M
D
```

or an equivalent absolute-day representation.

The following values SHOULD normally be derived rather than persisted:

```text
W
K
O
```

This avoids redundant state and impossible combinations such as:

```text
M08 D17 W32 K4
```

where the stored fields disagree.

A system accepting redundant fields MUST validate their consistency.

---

# 22. Validation

A regular date is valid exactly when:

```text
1 ≤ M ≤ 13
1 ≤ D ≤ 28
```

A week coordinate is valid exactly when:

```text
1 ≤ W ≤ 52
1 ≤ K ≤ 7
```

An ordinal coordinate is valid when:

```text
common year: 1 ≤ O ≤ 365
leap year:   1 ≤ O ≤ 366
```

Leap Day is valid only in a leap year.

Year Day is valid in every year.

Examples of invalid values:

```text
M00
M14

D00
D29

W00
W53

K0
K8

2026-LD
```

Implementations MUST reject invalid values rather than silently normalize them.

For example:

```text
M02 D29
```

MUST NOT silently become:

```text
M03 D01
```

---

# 23. Date arithmetic

Calendar arithmetic and elapsed-time arithmetic are distinct.

This distinction is particularly important because intercalary days are outside the week grid.

---

## 23.1 Elapsed days

Adding one elapsed day means moving to the next civil date.

Intercalary dates count as civil days.

For example in a leap year:

```text
M07 D28
+ 1 day
= LD

LD
+ 1 day
= M08 D01
```

Likewise:

```text
M13 D28
+ 1 day
= YD

YD
+ 1 day
= next year M01 D01
```

---

## 23.2 Calendar weeks

A calendar-week shift preserves `K`.

For regular dates:

```text
shift_week(Y/W/K, +1)
```

moves to the following regular week with the same `K`.

Because intercalary days do not belong to weeks, one calendar-week shift is not necessarily seven elapsed days.

For example, in a leap year:

```text
W28 K1
→ W29 K1
```

crosses Leap Day and therefore spans eight elapsed civil days.

Similarly:

```text
W52 K1
→ next year W01 K1
```

crosses Year Day and spans eight elapsed civil days.

Therefore:

> A calendar week is a structural unit, not universally an elapsed duration of seven civil dates.

An elapsed duration of seven days and a shift of one calendar week MUST NOT be treated as equivalent operations.

---

## 23.3 Month arithmetic

For regular dates, shifting by a calendar month preserves `D`.

Example:

```text
M04 D28 + 1 month = M05 D28
```

Because every month contains twenty-eight days, no end-of-month clamping is required.

Intercalary dates have no month coordinate.

Month arithmetic applied to an intercalary date is undefined unless the caller explicitly specifies a policy.

The core calendar defines no implicit substitution policy.

---

## 23.4 Year arithmetic

For regular dates, shifting by a calendar year preserves `M/D`.

Year Day shifted by whole years remains Year Day.

Leap Day shifted to another leap year remains Leap Day.

Leap Day shifted to a common year has no corresponding date.

Such an operation MUST report failure unless the caller explicitly supplies an application-specific substitution policy.

The core calendar MUST NOT silently choose:

```text
M07 D28
M08 D01
YD
```

as a substitute.

---

# 24. Recurrence

Recurring schedules SHOULD specify whether recurrence is structural or elapsed-time based.

## Weekly recurrence

A recurrence on:

```text
K3
```

occurs once in every regular week.

Intercalary days are skipped.

## Monthly recurrence

A recurrence on:

```text
D15
```

occurs exactly once in every month.

Every monthly day exists in every month.

## Annual regular recurrence

A recurrence on:

```text
M08 D17
```

occurs once every year.

## Year Day recurrence

```text
YD
```

occurs once every year.

## Leap Day recurrence

```text
LD
```

occurs only in leap years.

## Elapsed-day recurrence

A recurrence every `N` elapsed days includes both Leap Day and Year Day when encountered.

No implicit substitution rule exists for missing recurrence targets.

---

# 25. Localization

Canonical month labels are:

```text
M01 .. M13
```

Canonical weekday labels are:

```text
K1 .. K7
```

Locales MAY provide human labels.

Examples:

### English months

```text
Month 1
Month 2
...
Month 13
```

### Korean months

```text
1월
2월
...
13월
```

### Japanese months

```text
1月
2月
...
13月
```

Weekday aliases may likewise be localized.

For example:

```text
K1 → 월 / 月 / Monday
K2 → 화 / 火 / Tuesday
...
K7 → 일 / 日 / Sunday
```

A localized label MUST map to exactly one semantic value.

Changing a label MUST NOT change its ordinal position.

Canonical parsers SHOULD NOT accept localized names.

Localization belongs at system boundaries.

---

# 26. Display order

The standard structural order of calendar units is largest to smallest:

```text
Y → M → D
Y → W → K
Y → O
```

Canonical interchange MUST use this order.

Human interfaces SHOULD use the same order when practical.

Locales MAY provide alternate presentation conventions, but such representations are display-only and MUST NOT affect interchange or semantics.

---

# 27. Week presentation

A complete month MAY be rendered as:

```text
M08

      K1 K2 K3 K4 K5 K6 K7
W29   01 02 03 04 05 06 07
W30   08 09 10 11 12 13 14
W31   15 16 17 18 19 20 21
W32   22 23 24 25 26 27 28
```

This representation exposes both coordinate systems simultaneously.

For example:

```text
M08 D17
=
W31 K3
```

without additional calculation or lookup.

---

# 28. Chronological sort representation

For systems where date strings need to expose chronological position directly, ordinal notation SHOULD be used:

```text
2026-O001
2026-O002
...
2026-O365
```

Within canonical four-digit non-negative years, these strings sort lexicographically in chronological order.

Primary civil serialization SHOULD still be used when human readability is more important:

```text
2026-08-17
```

Semantic sorting MUST NOT depend on textual ordering.

---

# 29. Standard alignment epoch

For interoperability with the existing Gregorian calendar, the standard alignment is:

```text
International Rational: 2000-01-01
Proleptic Gregorian:    2000-01-01
```

These identify the same civil day.

Conversion between calendars MUST proceed by elapsed-day count from this alignment point.

Month numbers and day numbers MUST NOT be converted by direct field substitution.

This alignment also gives:

```text
International Rational 2026-01-01
=
Gregorian 2026-01-01
```

because the two calendars contain the same number of whole civil days between the two year boundaries.

This correspondence does not imply that dates later within a year have identical month/day fields.

It also does not imply that `K` corresponds to the Gregorian weekday assigned to the same physical day.

---

# 30. Time and time zones

This specification defines calendar dates only.

It does not define:

- hours
- minutes
- seconds
- leap seconds
- UTC
- time zones
- daylight-saving rules

A time-zone system determines when a local civil date begins and ends.

Calendar dates and clock times SHOULD remain separate semantic types.

For example:

```text
Date
LocalTime
TimeZone
Instant
```

SHOULD NOT be conflated.

---

# 31. Concepts deliberately not defined

The core calendar does not define:

- quarters
- financial years
- fiscal periods beyond months
- public holidays
- working days
- weekends
- religious observance
- business-day arithmetic
- seasons
- named eras
- time zones

These are policies or derived concepts layered on top of the calendar.

In particular, `K6` and `K7` are not intrinsically weekends.

A culture or organization MAY assign that meaning.

---

# 32. Required invariants

A conforming implementation MUST preserve all of the following:

```text
13 months/year
28 regular days/month
4 weeks/month
52 regular weeks/year
7 regular weekdays/week

13 × 28 = 52 × 7 = 364
```

For every regular date:

```text
(Y,M,D) ↔ (Y,W,K)
```

For every civil date:

```text
Date ↔ (Y,O)
```

For every month:

```text
D01 → K1
D02 → K2
D03 → K3
D04 → K4
D05 → K5
D06 → K6
D07 → K7

D08 → K1
...
D28 → K7
```

For every year:

```text
M01 → W01..W04
...
M13 → W49..W52
```

Intercalary dates MUST NOT modify these relationships.

---

# 33. Reference examples

## Common year

```text
2026-01-01
=
Y2026 M01 D01
=
Y2026 W01 K1
=
Y2026 O001
```

```text
2026-08-17
=
Y2026 M08 D17
=
Y2026 W31 K3
=
Y2026 O213
```

```text
2026-13-28
=
Y2026 W52 K7
=
Y2026 O364
```

```text
2026-YD
=
Y2026 O365
```

---

## Leap year

`2028` is a leap year.

```text
2028-07-28
=
W28 K7
=
O196
```

followed by:

```text
2028-LD
=
O197
```

followed by:

```text
2028-08-01
=
W29 K1
=
O198
```

The year ends:

```text
2028-13-28
=
W52 K7
=
O365
```

followed by:

```text
2028-YD
=
O366
```

followed by:

```text
2029-01-01
=
W01 K1
=
O001
```

---

# 34. Minimal implementation model

A straightforward implementation may use:

```text
Date =
    Regular(Y, M, D)
  | LeapDay(Y)
  | YearDay(Y)
```

A data-oriented implementation may instead store:

```text
absolute_day: signed integer
```

and derive all calendar coordinates on demand.

It SHOULD NOT persist redundant combinations such as:

```text
Y
M
D
W
K
O
```

unless external requirements justify the redundancy.

The calendar is specifically designed so that most useful properties are cheap deterministic projections of a minimal value.

---

# 35. Summary

The International Rational Calendar consists of a perfectly regular 364-day coordinate grid:

```text
13 months × 28 days
=
52 weeks × 7 weekdays
```

plus one annual intercalary day and one additional intercalary day in leap years.

Its fundamental semantic units are:

```text
Y  year
M  month
D  day of month
W  week of year
K  weekday
O  ordinal day
```

Regular dates can be addressed equivalently as:

```text
Y / M / D
```

or:

```text
Y / W / K
```

while all dates can be addressed as:

```text
Y / O
```

Intercalary dates remain first-class tagged values rather than malformed members of the regular grid.

Canonical interchange is numeric and language-independent.

Localization changes labels, never structure.

Derived information is computed rather than redundantly stored.

The result is a calendar whose civil, planning, computational, and localized views are different projections of one small, precise underlying data model.

SPDX-License-Identifier: CC-BY-SA-4.0
