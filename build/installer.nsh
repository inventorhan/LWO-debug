!macro customInstallMode
  ; LWO is a per-user desktop app. Skipping the install-mode page avoids
  ; the NSIS UAC/multi-user path that can crash on some Windows builds.
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customCheckAppRunning
  ; Electron Builder's default NSIS check can stop with
  ; "LWO cannot be closed" when a hidden/background LWO.exe remains.
  ; LWO saves form data continuously, so terminate stale processes before
  ; replacing installed files.
  DetailPrint "Closing running LWO process if found..."
  nsExec::ExecToLog `"$SYSDIR\taskkill.exe" /IM "${APP_EXECUTABLE_FILENAME}" /T`
  Sleep 700
  nsExec::ExecToLog `"$SYSDIR\taskkill.exe" /F /IM "${APP_EXECUTABLE_FILENAME}" /T`
  Sleep 700

  ; Older LWO installers can fail during their silent uninstall step after
  ; the app was already closed. Remove that legacy uninstaller first so this
  ; installer can overwrite the app in-place and register a fresh uninstaller.
  IfFileExists "$INSTDIR\${UNINSTALL_FILENAME}" 0 +2
    Delete "$INSTDIR\${UNINSTALL_FILENAME}"
!macroend
