# Third-party software and references

The educational interface is original repository code. Brand research informs layout and interaction; no competitor artwork, logos, or proprietary font files are bundled. Kaspa identity assets retain their existing attribution in LICENSE.md.

## Kaspa SDK v2.0.1

Official distribution: https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.1
Installed separately by scripts/setup-testnet.mjs. The complete upstream distribution retains its included license.

ISC License

Copyright (c) 2022-2024 Kaspa developers

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.


## SilverScript v1-rc1

Official release: https://github.com/kaspanet/silverscript/releases/tag/v1-rc1
The compiler is installed separately. Refundable transfer follows the recipient-claim/sender-timeout pattern demonstrated by SilverScript and CashScript. The payment split is repository-specific experimental code. Neither is audited.

ISC License

Copyright 2026 Kaspa Developers

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

## SilverScript upstream acknowledgements

The following upstream notices are retained for its CashScript-derived grammar and examples.

# Credits and Third-Party Licenses

SilverScript is a programming language for Kaspa smart contracts. While the SilverScript compiler is an original implementation, this project incorporates and builds upon work from the CashScript project.

## Acknowledgements

- **CashScript**: SilverScript is heavily inspired by the [CashScript](https://cashscript.org/) language. We are grateful to Rosco Kalis and the CashScript contributors for their work in advancing script-based smart contract languages.

## Third-Party Components

### 1. Language Grammar and Syntax
The SilverScript grammar specification (located in `src/silverscript.pest`) is a derivative work based on the [CashScript grammar documentation](https://cashscript.org/docs/compiler/grammar).

### 2. Contract Examples
Many smart contract examples included in this repository (e.g., in the `/tests` directory) are sourced or adapted from the CashScript repository.

---

## License for CashScript Components

The components listed above are used under the terms of the MIT License:

```
Copyright 2019 Rosco Kalis

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Argent compiler and generated workshop artifacts

The optional Argent workshop includes project `.ag` sources in `contracts/public/argent-habitat/`, generated SilverScript and the compiled `src/public-argent-templates.json` package. `scripts/build-public-argent.mjs` pins compiler revision `d08e52dd1e18c9f7e9a2dc482048c2db31d25611` from [argent-lang/argent](https://github.com/argent-lang/argent/tree/d08e52dd1e18c9f7e9a2dc482048c2db31d25611). The compiler is a local build dependency, not a browser compiler service. Its installed upstream license reads:

ISC License

Copyright 2026 Argent-lang developers

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.


Local compiler and VM verification does not establish a completed live Argent lifecycle. Public-origin creation and feeding remain gated; source inspection and recovery are separate capabilities. See [the integration notes](docs/newdesign/ARGENT-INTEGRATION.md).

## Dependency boundary

KCC material informs research; these custom experimental tokens do not claim KCC conformance. A source link or design inspiration is not a claim of affiliation. Upstream software and its notices retain their original terms; the project’s noncommercial license does not relicense those dependencies.
