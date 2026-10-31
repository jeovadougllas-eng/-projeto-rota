# CNPJ below the customer name and live search

Customer list entries show the CNPJ directly below the legal name, in the same family at a smaller size, in both themes. The shared read-only identity helper formats the document as `00.000.000/0000-00`, retains leading zeroes, reads imported/root/official fields, and displays `CNPJ não informado` for missing data. It never edits client records or guesses missing digits.

The registry, map, appointment and recommendation search inputs include the CNPJ, accepting partial digits and punctuation on each input event. Name/address/region searches and the existing filters/selection remain. Results use only the loaded account/portfolio; there is no external lookup or new customer cache. Labels also cover client details, focused-map actions, route stops, appointment entries, visit history and sales history. Historical visits use their own CNPJ snapshot when present and a live fallback only when absent.

No database, address/geolocation, brand or background changes are required. The pending CEP/manual-pin request remains excluded.

Release evidence will be recorded after CI and public verification. Tests use synthetic client identifiers.
