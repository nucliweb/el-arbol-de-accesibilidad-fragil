# Take part in the benchmark

[Versión en español](PARTICIPA.md)

This benchmark measures how much the accessibility tree costs depending on how a page is built: with native HTML or with component libraries. My data comes from a single machine, an Apple M4 with the CPU throttled to resemble a modest phone. With your results, on your real device, the comparison no longer depends on one machine.

## The easiest way: in your browser

Open **<https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/>** on your computer or your phone. Nothing to install, and it takes about 2 minutes. If you use a screen reader, run it twice, with the screen reader off and on: the page compares both and prepares the report to send.

It measures something simpler than the terminal version: how long your browser stays blocked after each action. It does not measure how long your screen reader takes to speak, and it records no traces. In exchange, it works in any browser and with any screen reader, on your real device.

## In the terminal

There are two tests:

- **Chrome** (`npm run participate`): any system (macOS, Windows or Linux). It measures the page load and a keyboard task on two levels, a radio button group and a realistic travel site (A11yConf Travel), with Chrome accessibility off and on. It takes 10 to 25 minutes, depending on the device, and you can keep using the computer, although heavy use makes the results noisier.
- **VoiceOver** (`npm run participate:voiceover`), optional and macOS only: it measures how long VoiceOver takes to respond to each key press. It takes about 20 minutes and **VoiceOver speaks and moves the focus during the test: you cannot use the Mac meanwhile**.

Each test runs twice: with the CPU throttled x4, as in the talk, so the results are comparable, and with the CPU at x1, your device as it is.

## What you need

- Comfort with the terminal.
- [Node.js](https://nodejs.org/) 26 (the active LTS) or later. If you use nvm or fnm, the repository's `.nvmrc` file already sets the version: `nvm use` or `fnm use`.
- [Google Chrome](https://www.google.com/chrome/) stable.
- Git.
- About 1.1 GB free for the dependencies.
- For VoiceOver: in VoiceOver Utility > General, check "Allow VoiceOver to be controlled with AppleScript". The first time, macOS asks you to let the terminal control VoiceOver.

## How to run it

These steps were tested on macOS (Apple M4, macOS 27, Node 26 and Chrome 158). For Windows and Linux, see [the next section](#windows-and-linux-untested) first.

```sh
git clone https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil.git
cd el-arbol-de-accesibilidad-fragil/bench
npm ci
npm run setup                    # installs and builds the apps; a few minutes
npm run participate              # Chrome
npm run participate:voiceover    # optional, macOS only
```

To keep the results comparable:

- If you use a laptop, plug it in.
- Close heavy applications.
- Do not run other tests at the same time.

## Windows and Linux (untested)

> **Note:** the benchmark has only been tested on macOS. The Chrome measurements do not depend on the operating system and should work on Windows and Linux, but nobody has checked yet. If you run it, please tell us in the issue how it went, even if it fails. The VoiceOver test only exists on macOS.

### Windows

In PowerShell or Windows Terminal:

```powershell
winget install OpenJS.NodeJS.LTS   # Node 26; or the installer from nodejs.org
winget install Google.Chrome
winget install Git.Git
```

Close and reopen the terminal so it finds `node` and `git`, then follow [How to run it](#how-to-run-it) without the last command (VoiceOver). If your computer has power modes, use "Best performance" or at least plug it in.

### Linux

```sh
# Node 26 with nvm (https://github.com/nvm-sh/nvm) or fnm
nvm install 26

# Stable Google Chrome, with Playwright's installer (asks for sudo)
cd el-arbol-de-accesibilidad-fragil/bench && npm ci && npx playwright install chrome
```

On Debian or Ubuntu you can also install Chrome with the `.deb` package from <https://www.google.com/chrome/>; Google publishes stable Chrome for x64 and ARM64. Chrome runs without a window: no desktop is needed.

Then follow [How to run it](#how-to-run-it) without the last command (VoiceOver).

## What data is collected

When it starts, the test shows exactly which machine details are saved: operating system and version, architecture, CPU model and number of cores, memory, and the Node, Chrome and VoiceOver versions. **The machine name, your user name and paths on your disk are never saved.**

Nothing is sent automatically. When it finishes you have two files in `bench/results/participant/`:

- `participant-<date>.md`: the text report, with tables.
- `participant-<date>.json.gz`: the raw results.

The Chrome traces it also records (in `bench/results/traces/`) stay on your machine; there is no need to share them. Besides the details above, they include the hardware model, the GPU and the OS version.

## How to share the results

1. Open an issue with the ["Benchmark results"](https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/new?template=benchmark-results.yml) form.
2. Paste the content of `participant-<date>.md` into "Report".
3. Drag `participant-<date>.json.gz` into "Raw results".
4. If you like, tell us which device you use and whether you use assistive technology every day.

The issue is public: by submitting it you agree that the results are published in the repository and used in the talk.

## If something fails

- **"Google Chrome (stable) was not found"**: install stable Chrome or run `npx playwright install chrome`.
- **"Allow VoiceOver to be controlled by AppleScript first"**: turn on the VoiceOver Utility option described above.
- **VoiceOver is still flagged as on at the end**: when a script quits VoiceOver, macOS can keep flagging it as on, and Chrome then does accessibility work on every page. The test warns you; press Cmd+F5 twice (on, then off) to clear it.
- **Any other error**: open a regular issue with the terminal message.

More detail on what each test measures and how: [benchmark README](README.md) (in Spanish).
