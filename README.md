# HDLBits Companion

A Windows compatible VS Code companion for the classic HDLBits site.

## License

HDLBits Companion is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). The HDLBits name, site content, and other third-party materials are not covered by this project license.

## What it does

- Loads the live official problem catalogue into an HDLBits view in Explorer.
- Displays problem statements and the official starter module.
- Opens an editable Verilog starter in an untitled VS Code editor.
- Copies the active solution and opens that problem on HDLBits for the user to paste and submit.
- Opens HDLBits' own account progress page and official sign-in page.

## Authentication, judging, and progress

The extension never asks for, stores, or transmits a password or session cookie. The live site uses an official username/password form at `https://hdlbits.01xz.net/wiki/Special:VlgLogin`. Exercise pages submit a form to `https://hdlbits.01xz.net/runsim.php` using a per-page hidden `tc` field. The extension does not imitate that form or guess the hidden token. Instead, the submit command opens the official exercise page and copies your editor contents; paste into the HDLBits editor and press its **Submit** button. The real HDLBits judge then returns its result and records account progress according to HDLBits' own behavior.

The official **My Stats** page is opened at `https://hdlbits.01xz.net/wiki/Special:VlgStats/Me`. The extension cannot read the signed-in browser's session or confirm that page belongs to your account, so it does not claim to synchronize progress inside VS Code. If the browser is signed in, HDLBits displays your account's stats there.

This boundary is caused by browser session isolation: VS Code extension requests do not inherit cookies from the user's default browser. A reliable direct integration would require an official HDLBits API or an approved browser/session bridge; neither was verified on the live site. No authentication endpoint beyond the observed sign-in page and no judge fields beyond the observed form are assumed.

## Install

1. Download `hdlbits-companion-0.1.2.vsix` from the output folder. If an older version is installed, this package updates it.
2. In VS Code, open **Extensions** (`Ctrl+Shift+X`), choose the `...` menu, then **Install from VSIX...**.
3. Select the VSIX. Open Explorer and expand **HDLBits**.
4. Select a problem to view its statement. Use its context menu to open a starter in the editor.
5. Use **HDLBits: Submit Current File on HDLBits**, paste into the official page, and click **Submit** there. View account results with **HDLBits: Open My Account Progress**.

The first catalogue load needs internet access to `hdlbits.01xz.net`.
