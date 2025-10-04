# AUDIOKING Audio Converter - PowerShell Installer
# Version 1.0.0
# Professional Windows Installer Script

param(
    [switch]$Silent,
    [string]$InstallPath = "$env:LOCALAPPDATA\AUDIOKING",
    [switch]$NoShortcuts,
    [switch]$Portable
)

# Set execution policy for current process
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Clear screen and show banner
Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    AUDIOKING Audio Converter Installer" -ForegroundColor Yellow
Write-Host "    Version 1.0.0 - PowerShell Edition" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$AppName = "AUDIOKING"
$AppDisplayName = "AUDIOKING Audio Converter"
$AppVersion = "1.0.0"
$AppPublisher = "AUDIOKING"
$AppDescription = "Universal Audio Format Converter"
$ZipFileName = "AUDIOKING-Installer.zip"
$ExecutableName = "AUDIOKING.exe"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ZipPath = Join-Path $ScriptDir $ZipFileName

# Functions
function Write-ColorText($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Step($StepNumber, $Description) {
    Write-ColorText "[$StepNumber] $Description" "Green"
}

function Write-Error($ErrorMessage) {
    Write-ColorText "ERROR: $ErrorMessage" "Red"
}

function Write-Success($Message) {
    Write-ColorText "$Message" "Green"
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Create-Shortcut($LinkPath, $TargetPath, $Description = "") {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($LinkPath)
    $Shortcut.TargetPath = $TargetPath
    $Shortcut.WorkingDirectory = Split-Path $TargetPath
    $Shortcut.Description = $Description
    $Shortcut.Save()
}

function Register-Application($InstallDir) {
    $UninstallKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"
    $AppKey = "HKCU:\Software\$AppName"
    
    # Create registry entries
    New-Item -Path $UninstallKey -Force | Out-Null
    New-Item -Path $AppKey -Force | Out-Null
    
    # Set uninstall information
    Set-ItemProperty -Path $UninstallKey -Name "DisplayName" -Value $AppDisplayName
    Set-ItemProperty -Path $UninstallKey -Name "DisplayVersion" -Value $AppVersion
    Set-ItemProperty -Path $UninstallKey -Name "Publisher" -Value $AppPublisher
    Set-ItemProperty -Path $UninstallKey -Name "InstallLocation" -Value $InstallDir
    Set-ItemProperty -Path $UninstallKey -Name "UninstallString" -Value (Join-Path $InstallDir "Uninstall.ps1")
    Set-ItemProperty -Path $UninstallKey -Name "DisplayIcon" -Value (Join-Path $InstallDir $ExecutableName)
    Set-ItemProperty -Path $UninstallKey -Name "NoModify" -Value 1 -Type DWord
    Set-ItemProperty -Path $UninstallKey -Name "NoRepair" -Value 1 -Type DWord
    Set-ItemProperty -Path $UninstallKey -Name "EstimatedSize" -Value 204800 -Type DWord
    
    # Set application information
    Set-ItemProperty -Path $AppKey -Name "InstallPath" -Value $InstallDir
    Set-ItemProperty -Path $AppKey -Name "Version" -Value $AppVersion
}

function Create-Uninstaller($InstallDir) {
    $UninstallerContent = @"
# AUDIOKING Uninstaller
param([switch]`$Silent)

if (-not `$Silent) {
    `$response = Read-Host "Are you sure you want to uninstall AUDIOKING? (Y/N)"
    if (`$response -notmatch '^[Yy]') {
        Write-Host "Uninstallation cancelled."
        Read-Host "Press Enter to exit"
        exit
    }
}

Write-Host "Uninstalling AUDIOKING..." -ForegroundColor Yellow

# Remove registry entries
Remove-Item "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\AUDIOKING" -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\AUDIOKING" -Force -ErrorAction SilentlyContinue

# Remove shortcuts
Remove-Item "`$env:USERPROFILE\Desktop\AUDIOKING.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item "`$env:APPDATA\Microsoft\Windows\Start Menu\Programs\AUDIOKING.lnk" -Force -ErrorAction SilentlyContinue

# Remove installation directory
if (Test-Path "$InstallDir") {
    Remove-Item "$InstallDir" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "AUDIOKING has been uninstalled successfully." -ForegroundColor Green
if (-not `$Silent) { Read-Host "Press Enter to exit" }
"@
    
    $UninstallerPath = Join-Path $InstallDir "Uninstall.ps1"
    $UninstallerContent | Out-File -FilePath $UninstallerPath -Encoding UTF8
}

# Main Installation Process
try {
    # Check if ZIP file exists
    if (-not (Test-Path $ZipPath)) {
        Write-Error "Installation package '$ZipFileName' not found in script directory."
        Write-Host "Please ensure both the installer script and ZIP file are in the same location."
        if (-not $Silent) { Read-Host "Press Enter to exit" }
        exit 1
    }
    
    # Show installation information
    if (-not $Silent) {
        Write-Host ""
        Write-ColorText "Installation Details:" "Cyan"
        Write-Host "  Application: $AppDisplayName"
        Write-Host "  Version: $AppVersion"
        Write-Host "  Install Location: $InstallPath"
        Write-Host "  Package Size: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 1)) MB"
        Write-Host ""
        
        if (-not $Portable) {
            $confirm = Read-Host "Continue with installation? (Y/N)"
            if ($confirm -notmatch '^[Yy]') {
                Write-Host "Installation cancelled."
                exit 0
            }
        }
    }
    
    Write-Host ""
    Write-Step "1/6" "Preparing installation..."
    
    # Create installation directory
    if (-not (Test-Path $InstallPath)) {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    }
    
    Write-Step "2/6" "Extracting application files..."
    
    # Extract ZIP file
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $InstallPath)
    }
    catch {
        Write-Error "Failed to extract application files: $($_.Exception.Message)"
        if (-not $Silent) { Read-Host "Press Enter to exit" }
        exit 1
    }
    
    # Verify installation
    $ExePath = Join-Path $InstallPath $ExecutableName
    if (-not (Test-Path $ExePath)) {
        Write-Error "Installation verification failed - $ExecutableName not found."
        if (-not $Silent) { Read-Host "Press Enter to exit" }
        exit 1
    }
    
    if (-not $Portable) {
        Write-Step "3/6" "Registering application..."
        Register-Application $InstallPath
        
        Write-Step "4/6" "Creating uninstaller..."
        Create-Uninstaller $InstallPath
        
        if (-not $NoShortcuts) {
            Write-Step "5/6" "Creating shortcuts..."
            
            # Desktop shortcut
            $DesktopPath = Join-Path $env:USERPROFILE "Desktop\AUDIOKING.lnk"
            Create-Shortcut $DesktopPath $ExePath $AppDisplayName
            
            # Start Menu shortcut
            $StartMenuPath = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\AUDIOKING.lnk"
            Create-Shortcut $StartMenuPath $ExePath $AppDisplayName
        }
        
        Write-Step "6/6" "Finalizing installation..."
    } else {
        Write-Step "3/3" "Portable installation complete..."
    }
    
    # Installation complete
    Write-Host ""
    Write-ColorText "==========================================" "Green"
    Write-ColorText "    Installation Successful!" "Green"
    Write-ColorText "==========================================" "Green"
    Write-Host ""
    
    if (-not $Portable) {
        Write-Host "AUDIOKING has been installed to:"
        Write-ColorText "  $InstallPath" "Yellow"
        Write-Host ""
        
        if (-not $NoShortcuts) {
            Write-Host "Shortcuts created:"
            Write-Host "  • Desktop shortcut"
            Write-Host "  • Start Menu shortcut"
            Write-Host ""
        }
        
        Write-Host "To uninstall, use Windows Settings > Apps or run:"
        Write-ColorText "  $InstallPath\Uninstall.ps1" "Yellow"
    } else {
        Write-Host "AUDIOKING portable installation complete:"
        Write-ColorText "  $InstallPath" "Yellow"
        Write-Host ""
        Write-Host "Run $ExecutableName to start the application."
    }
    
    Write-Host ""
    
    if (-not $Silent) {
        $launch = Read-Host "Would you like to launch AUDIOKING now? (Y/N)"
        if ($launch -match '^[Yy]') {
            Start-Process -FilePath $ExePath
        }
    }
    
    Write-Host ""
    Write-ColorText "Thank you for installing AUDIOKING! 🎵" "Green"
    
} catch {
    Write-Error "Installation failed: $($_.Exception.Message)"
    Write-Host "Stack trace: $($_.ScriptStackTrace)"
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

if (-not $Silent) {
    Write-Host ""
    Read-Host "Press Enter to exit"
}