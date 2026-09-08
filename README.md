# International Rational Calendar (IRC)

A fixed solar calendar designed for structural regularity, precise notation, and simple arithmetic. Thirteen equal months provide a consistent calendar for civil dates and planning, with language-independent data and localized labels.

**Status:** Draft 0.1. This repository contains the specification, reference appendix, and executable conformance checks.

- [Calendar specification](./SPEC-Draft-0.1.md) — structure, semantics, notation, localization, and design principles.
- [Reference appendix](./REFERENCE-APPENDIX-Draft-0.1.md) — exact grammar, binary encoding, conversion algorithms, arithmetic, and test vectors.

## Structure

Every year has **13 months of 28 days**, forming exactly **52 weeks of 7 weekdays**:

```text
13 × 28 = 52 × 7 = 364 regular days
```

Every month follows the same pattern:

```text
K1 K2 K3 K4 K5 K6 K7
01 02 03 04 05 06 07
08 09 10 11 12 13 14
15 16 17 18 19 20 21
22 23 24 25 26 27 28
```

**Year Day (`YD`)** follows month 13 every year. **Leap Day (`LD`)** falls between months 7 and 8 in leap years. These are civil dates outside the month and week grid, so every month always begins on `K1` and ends on `K7`.

A year is leap when it is divisible by **4**, except when it is divisible by **128**. This gives 365 or 366 civil days per year, averaging **365.2421875 days**. Years are signed integers, including year zero; the same rule applies to negative years.

## One date, multiple coordinates

Regular dates can be expressed by month and day, week and weekday, or ordinal day of year:

```text
2026-08-17   month 8, day 17
2026-W31-K3  week 31, weekday 3
2026-O213    ordinal day 213
```

All three identify the same IRC date. Each symbol has one meaning: `Y` year, `M` month, `D` day of month, `W` week of year, `K` weekday, and `O` ordinal day of year.

Intercalary dates have explicit forms:

```text
2028-LD     Leap Day — ordinal 197
2028-YD     Year Day — ordinal 366
```

They have a year and ordinal, but no month, day-of-month, week, or weekday. Ordinal coordinates and the absolute day index cover every civil date.

## Design principles

- **Localization changes labels, never structure.** Languages can supply month and weekday names while numeric identities and ordering remain universal.
- **Separate meaning, interchange, and display.** A semantic date, its canonical text, and its localized presentation are distinct layers.
- **Store minimal state.** Week, weekday, and ordinal coordinates are deterministic projections; an absolute day index can represent the entire date.
- **Make exceptional dates explicit.** Leap Day and Year Day are first-class values, preserving the regular grid.
- **Distinguish calendar shifts from elapsed days.** A one-week shift preserves the weekday and can cross an intercalary day, spanning eight civil days. Adding seven days is a separate operation.

## Gregorian alignment

IRC `2000-01-01` and proleptic Gregorian `2000-01-01` identify the same civil day. Conversion proceeds by counting days from that alignment.

The notation requires calendar context: IRC `2026-08-17` corresponds to Gregorian `2026-08-01`. Matching field values do not generally identify the same day, and IRC weekdays do not imply Gregorian weekday equivalence.

The specification defines dates. Time zones, clock times, holidays, weekends, and business-day policies belong to separate layers.

## Reference checks

Run the checks with [Bun](https://bun.com/):

```sh
bun test
```

The [reference tests](./test/reference.test.ts) validate the published text and binary vectors, arithmetic examples, negative and non-negative calendar cycles, and Gregorian conversions. They are reference checks rather than a production calendar library or a complete certification suite.

## Changelog

See [releases on GitHub](https://github.com/maxmilton/international-rational-calendar/releases).

## License

The International Rational Calendar specification and accompanying
documentation are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See [LICENSES/CC-BY-SA-4.0.txt](./LICENSES/CC-BY-SA-4.0.txt).

Source code and executable test cases in `test/` are licensed under
the MIT License. See [LICENSES/MIT.txt](./LICENSES/MIT.txt).

The CC BY-SA license applies to the specification text and documentation, not to independent software implementations of the specification. Implementations may be distributed under any license.

---

© [Max Milton](https://maxmilton.com)
