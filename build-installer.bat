@echo off
title AUDIOKING Installer Builder
cls

echo ==========================================
echo    AUDIOKING Installer Builder v1.0.0
echo    Creating Windows Installer Package
echo ==========================================
echo.

:: Set paths
set "PROJECT_DIR=%~dp0"
set "DIST_DIR=%PROJECT_DIR%dist"
set "INSTALLER_DIR=%PROJECT_DIR%installer"
set "SETUP_DIR=%PROJECT_DIR%setup"

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/6] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo [2/6] Building Electron application...
call npm run pack
if errorlevel 1 (
    echo ERROR: Failed to build Electron application.
    pause
    exit /b 1
)

:: Verify build output
if not exist "%DIST_DIR%\win-unpacked\AUDIOKING.exe" (
    echo ERROR: Build failed - AUDIOKING.exe not found.
    pause
    exit /b 1
)

echo.
echo [3/6] Creating installer directories...
if not exist "%INSTALLER_DIR%" mkdir "%INSTALLER_DIR%"
if not exist "%SETUP_DIR%" mkdir "%SETUP_DIR%"

echo.
echo [4/6] Creating ZIP package...
:: Create ZIP file using PowerShell
powershell -Command "Compress-Archive -Path '%DIST_DIR%\win-unpacked\*' -DestinationPath '%SETUP_DIR%\AUDIOKING-Installer.zip' -Force"
if errorlevel 1 (
    echo ERROR: Failed to create ZIP package.
    pause
    exit /b 1
)

echo.
echo [5/6] Copying installer files...
:: Copy the existing installer scripts to setup directory
copy /Y "%PROJECT_DIR%setup\AUDIOKING-Installer.bat" "%SETUP_DIR%\" >nul
copy /Y "%PROJECT_DIR%setup\AUDIOKING-Installer.ps1" "%SETUP_DIR%\" >nul
copy /Y "%PROJECT_DIR%setup\README.md" "%SETUP_DIR%\" >nul

:: Update file sizes and information
for %%F in ("%SETUP_DIR%\AUDIOKING-Installer.zip") do set "ZIP_SIZE=%%~zF"
set /a "ZIP_MB=%ZIP_SIZE% / 1048576"

echo.
echo [6/6] Creating portable installer...
:: Create a simple portable installer
(
echo @echo off
echo title AUDIOKING Portable Installer
echo cls
echo.
echo =======================================
echo    AUDIOKING Portable Installation
echo =======================================
echo.
echo This will extract AUDIOKING to the current directory.
echo.
set /p "install_here=Install in current directory? (Y/N): "
if /i "%%install_here%%"=="Y" (
    echo.
    echo Extracting AUDIOKING...
    powershell -Command "Expand-Archive -Path 'AUDIOKING-Installer.zip' -DestinationPath '.\AUDIOKING' -Force"
    if exist "AUDIOKING\AUDIOKING.exe" (
        echo.
        echo Installation complete!
        echo Run AUDIOKING\AUDIOKING.exe to start the application.
        echo.
        set /p "launch_now=Launch AUDIOKING now? (Y/N): "
        if /i "%%launch_now%%"=="Y" start "" "AUDIOKING\AUDIOKING.exe"
    ) else (
        echo ERROR: Installation failed!
    )
) else (
    echo Installation cancelled.
)
echo.
pause
) > "%SETUP_DIR%\AUDIOKING-Portable-Install.bat"

echo.
echo ==========================================
echo    Build Complete!
echo ==========================================
echo.
echo Created installer packages:
echo.
echo 1. Standard Installer Package:
echo    Location: %SETUP_DIR%\
echo    - AUDIOKING-Installer.bat (Recommended)
echo    - AUDIOKING-Installer.ps1 (PowerShell version)
echo    - AUDIOKING-Installer.zip (%ZIP_MB% MB)
echo.
echo 2. Portable Installer:
echo    - AUDIOKING-Portable-Install.bat
echo.
echo 3. Direct Run:
echo    - %DIST_DIR%\win-unpacked\AUDIOKING.exe
echo.

:: Ask user what they want to do next
echo What would you like to do next?
echo [1] Open setup folder
echo [2] Run the installer
echo [3] Test the application
echo [4] Exit
echo.
set /p "choice=Enter your choice (1-4): "

if "%choice%"=="1" start "" "%SETUP_DIR%"
if "%choice%"=="2" start "" "%SETUP_DIR%\AUDIOKING-Installer.bat"
if "%choice%"=="3" start "" "%DIST_DIR%\win-unpacked\AUDIOKING.exe"

echo.
echo Build process completed successfully!
pause