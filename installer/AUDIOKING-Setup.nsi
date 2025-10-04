; AUDIOKING Windows Installer Script
; Created with NSIS (Nullsoft Scriptable Install System)
; Version 1.0.0

;--------------------------------
; Modern UI
!include "MUI2.nsh"

;--------------------------------
; General
Name "AUDIOKING Audio Converter"
OutFile "AUDIOKING-Setup-1.0.0.exe"
InstallDir "$LOCALAPPDATA\AUDIOKING"
InstallDirRegKey HKCU "Software\AUDIOKING" ""
RequestExecutionLevel user

;--------------------------------
; Variables
Var StartMenuFolder

;--------------------------------
; Interface Settings
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to AUDIOKING Audio Converter Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of AUDIOKING Audio Converter.$\r$\n$\r$\nAUDIOKING is a universal audio format converter that supports MP3, WAV, FLAC, and OPUS formats with YouTube integration.$\r$\n$\r$\nClick Next to continue."

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY

; Start Menu Folder Page Configuration
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU" 
!define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\AUDIOKING" 
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Start Menu Folder"
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder

!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

;--------------------------------
; Languages
!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Version Information
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "AUDIOKING Audio Converter"
VIAddVersionKey "Comments" "Universal audio format converter with YouTube integration"
VIAddVersionKey "CompanyName" "AUDIOKING"
VIAddVersionKey "LegalCopyright" "Copyright © 2024 AUDIOKING"
VIAddVersionKey "FileDescription" "AUDIOKING Audio Converter Installer"
VIAddVersionKey "FileVersion" "1.0.0.0"
VIAddVersionKey "ProductVersion" "1.0.0"
VIAddVersionKey "InternalName" "AUDIOKING-Setup"
VIAddVersionKey "OriginalFilename" "AUDIOKING-Setup-1.0.0.exe"

;--------------------------------
; Installer Sections

Section "AUDIOKING Application" SecApp
  SectionIn RO
  
  ; Set output path to the installation directory
  SetOutPath "$INSTDIR"
  
  ; Copy all files from the built application
  File /r "..\dist\win-unpacked\*.*"
  
  ; Store installation folder
  WriteRegStr HKCU "Software\AUDIOKING" "" $INSTDIR
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Register uninstaller in Windows Programs and Features
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                   "DisplayName" "AUDIOKING Audio Converter"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                   "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                   "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                   "Publisher" "AUDIOKING"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                   "DisplayIcon" "$INSTDIR\AUDIOKING.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                   "URLInfoAbout" "https://github.com/your-username/audioking"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                    "NoRepair" 1
                    
  ; Set estimated size (approximately 200MB in KB)
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" \
                    "EstimatedSize" 204800
SectionEnd

Section "Desktop Shortcut" SecDesktop
  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\AUDIOKING.lnk" "$INSTDIR\AUDIOKING.exe" "" "$INSTDIR\AUDIOKING.exe" 0
SectionEnd

Section "Start Menu Shortcuts" SecStartMenu
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\AUDIOKING.lnk" "$INSTDIR\AUDIOKING.exe" "" "$INSTDIR\AUDIOKING.exe" 0
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Uninstall AUDIOKING.lnk" "$INSTDIR\Uninstall.exe"
  
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

Section "File Associations" SecFileAssoc
  ; Register file associations for supported audio formats
  WriteRegStr HKCU "Software\Classes\.mp3\OpenWithList\AUDIOKING.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.wav\OpenWithList\AUDIOKING.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.flac\OpenWithList\AUDIOKING.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.opus\OpenWithList\AUDIOKING.exe" "" ""
  
  ; Refresh shell icons
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
SectionEnd

;--------------------------------
; Descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecApp} "The core AUDIOKING application files. This component is required."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Create a desktop shortcut for easy access to AUDIOKING."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} "Create Start Menu shortcuts for AUDIOKING and its uninstaller."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecFileAssoc} "Associate AUDIOKING with common audio file formats (MP3, WAV, FLAC, OPUS)."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
; Uninstaller Section

Section "Uninstall"
  ; Remove registry keys
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING"
  DeleteRegKey HKCU "Software\AUDIOKING"
  
  ; Remove file associations
  DeleteRegKey HKCU "Software\Classes\.mp3\OpenWithList\AUDIOKING.exe"
  DeleteRegKey HKCU "Software\Classes\.wav\OpenWithList\AUDIOKING.exe"
  DeleteRegKey HKCU "Software\Classes\.flac\OpenWithList\AUDIOKING.exe"
  DeleteRegKey HKCU "Software\Classes\.opus\OpenWithList\AUDIOKING.exe"
  
  ; Remove files and directories
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\AUDIOKING.lnk"
  
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder
  
  Delete "$SMPROGRAMS\$StartMenuFolder\AUDIOKING.lnk"
  Delete "$SMPROGRAMS\$StartMenuFolder\Uninstall AUDIOKING.lnk"
  RMDir "$SMPROGRAMS\$StartMenuFolder"
  
  ; Refresh shell icons
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
SectionEnd

;--------------------------------
; Functions

Function .onInit
  ; Check if already installed
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "AUDIOKING is already installed. $\n$\nClick 'OK' to remove the previous version or 'Cancel' to cancel this upgrade." \
  /SD IDOK IDOK uninst
  Abort
  
uninst:
  ClearErrors
  ExecWait '$R0 _?=$INSTDIR'
  
  IfErrors no_remove_uninstaller done
    Delete $R0
  no_remove_uninstaller:
  
done:
FunctionEnd