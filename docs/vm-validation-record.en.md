# Windows 11 acceptance record

Status on 11 October 2026: clean-machine or VM validation remains pending. The
execution account could not list Hyper-V VMs because of Windows permissions; no
VM result may be inferred from tests performed on the primary host.

The user historically confirmed a successful update to `v0.1.4`, identified in
Help. The published stable version subsequently advanced to `v0.2.7`; the
current priority test must use immutable artefacts from that release.

## Current priority: in-application update

The VM's primary objective is to prove an installed update while preserving
realistic test data. Use `v0.2.6` as source and `v0.2.7` as destination because
both releases are public and the source already includes the signed update flow.

1. Install `v0.2.6` and create a project, subtask, FS dependency, and calendar
   exception. Record titles, dates, progress, and export a backup.
2. In **Help > Check for updates**, confirm that `0.2.7` is offered.
3. Choose **Download and install update** and observe download, close, passive
   installation, and restart without manual uninstallation.
4. Confirm version `0.2.7` and unchanged data, dependencies, and calendar.
5. Edit a task, close, reopen, and confirm persistence.
6. Check again: it must report current version without reinstalling.
7. Disconnect the network, open and edit normally; a manual update check must
   fail informatively while preserving data.

## Historical evidence: 8 September 2026

- On that date, public `latest.json` reported `0.1.4`, Windows x64, and the
  standard-package URL. Manifest signature matched the published `.sig`.
- Interface tests simulate checking, installation/restart, interrupted download,
  and invalid signature; the latter must not restart. This is not cryptographic
  verification of the real installer.
- Desktop E2E: five launches, recovery after interruption, and complete
  import/persistence journey passed. It does not install updates.

This historical evidence does not replace current `v0.2.6` to `v0.2.7`
validation. The scenarios below remain distribution criteria.

Record Windows version, WebView2 version, version/hash of both installers,
previous version used for upgrade, display scale, and execution date.

| Scenario | Result | Evidence |
| --- | --- | --- |
| Standard installation without toolchain | Pending | |
| Offline installation with network disabled | Pending | |
| Offline opening and persistence after restart | Pending | |
| Backup, export, and import into an empty workspace | Pending | |
| Updater from prior version preserves projects/tasks | Pending | |
| Same-version repair preserves data | Pending | |
| Uninstall/reinstall: record data destination | Pending | |
| Keyboard, Esc, focus, and Narrator | Partial | AX structure and Esc approved; Narrator speech pending |
| 125% and 150% scaling, minimum width | Partial | WebView2 emulation approved; real Windows scaling pending |
| Desktop E2E five launches and complete journey | Pending | |
| Two diagnostic desktop-workflow runs | Pending | |

Use synthetic data only in the VM. Procedure details are in
[Windows installation](installation-windows.en.md),
[UX and accessibility](ux-accessibility.md), and
[WebView2 testing](webview2-testing.md).
