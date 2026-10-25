# Changelog

## 0.1.7 - 2026-10-25

- Avoid treating literal percentages followed by prose as printf placeholders.

## 0.1.6 - 2026-10-25

- Detect mismatches between JSON null and array values.
- Show the current package version in the app footer.
- Clarify how to run the downloaded source archive.

## 0.1.5 - 2026-10-13

- Preserve nested JSON keys beginning with `@`; only top-level ARB metadata is ignored.

## 0.1.4 - 2026-10-11

- Add a real screenshot of the app to the README.

## 0.1.3 - 2026-10-11

- Add project-specific ignore rules for local Node, test, environment, OS, and editor artifacts.

## 0.1.2 - 2026-10-11

- Complete the standard MIT license text, restoring the full warranty and liability disclaimer.

## 0.1.1 - 2026-10-11

- Reject ambiguous collisions between dotted literal catalog keys and flattened nested paths.
- Refresh CI actions and add a downloadable source archive.

## 0.1.0 - 2026-10-11

- Initial local-first JSON/ARB localization catalog checker.
- Compare key presence, value types, empty strings, and common interpolation placeholders.
