param(
  [string]$BuildPath = "C:\a",
  [ValidateSet("arm64-v8a", "x86_64")]
  [string]$Architecture = "arm64-v8a",
  [string]$OutputName = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outputDir = Join-Path $repoRoot "outputs"
if ([string]::IsNullOrWhiteSpace($OutputName)) {
  $OutputName = "ndjar-mvp-presentacao-offline-$Architecture.apk"
}
$outputApk = Join-Path $outputDir $OutputName

function Assert-UnderPath {
  param([string]$Path, [string]$Root)
  $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
  $resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
  if (-not $resolvedPath.StartsWith($resolvedRoot)) {
    throw "Unsafe path outside expected root: $resolvedPath"
  }
  return $resolvedPath
}

$existingWorktrees = git -C $repoRoot worktree list --porcelain
if ($existingWorktrees -match [regex]::Escape($BuildPath)) {
  git -C $repoRoot worktree remove --force $BuildPath 2>$null
}

if (Test-Path -LiteralPath $BuildPath) {
  $resolvedBuildPath = (Resolve-Path -LiteralPath $BuildPath).Path
  if ($resolvedBuildPath -ne $BuildPath) {
    throw "Unexpected build path: $resolvedBuildPath"
  }
  Remove-Item -LiteralPath "\\?\$resolvedBuildPath" -Recurse -Force
}

git -C $repoRoot worktree add --detach $BuildPath HEAD

try {
  $mobileRoot = Join-Path $BuildPath "apps\mobile"
  $androidRoot = Join-Path $mobileRoot "android"

  Set-Content -LiteralPath (Join-Path $BuildPath ".npmrc") -Value @(
    "node-linker=hoisted",
    "shamefully-hoist=true",
    "public-hoist-pattern[]=*"
  )

  pnpm -C $BuildPath install --no-frozen-lockfile
  pnpm -C $mobileRoot exec expo prebuild --platform android --no-install

  $gradleProperties = Join-Path $androidRoot "gradle.properties"
  (Get-Content -LiteralPath $gradleProperties) -replace "newArchEnabled=true", "newArchEnabled=false" |
    Set-Content -LiteralPath $gradleProperties

  $appBuildGradle = Join-Path $androidRoot "app\build.gradle"
  $buildGradleText = Get-Content -LiteralPath $appBuildGradle -Raw
  $abiFilterPattern = "abiFilters `"$Architecture`""
  if ($buildGradleText -notmatch [regex]::Escape($abiFilterPattern)) {
    $buildGradleText = $buildGradleText -replace 'versionName "0.1.0"', "versionName `"0.1.0`"`r`n        ndk {`r`n            $abiFilterPattern`r`n        }"
  }
  Set-Content -LiteralPath $appBuildGradle -Value $buildGradleText

  $mainApplication = Join-Path $androidRoot "app\src\main\java\com\ndjar\mobile\MainApplication.kt"
  (Get-Content -LiteralPath $mainApplication) -replace "override fun getUseDeveloperSupport\(\): Boolean = BuildConfig.DEBUG", "override fun getUseDeveloperSupport(): Boolean = false" |
    Set-Content -LiteralPath $mainApplication

  $bundlePath = Join-Path $androidRoot "app\build\generated\assets\react\debug\index.android.bundle"
  $resourcePath = Join-Path $androidRoot "app\build\generated\res\react\debug"
  New-Item -ItemType Directory -Path (Split-Path $bundlePath) -Force | Out-Null
  New-Item -ItemType Directory -Path $resourcePath -Force | Out-Null

  pnpm -C $mobileRoot exec expo export:embed `
    --entry-file (Join-Path $mobileRoot "index.ts") `
    --platform android `
    --dev false `
    --minify true `
    --bundle-output $bundlePath `
    --assets-dest $resourcePath `
    --reset-cache

  $mainAssets = Join-Path $androidRoot "app\src\main\assets"
  $mainRes = Join-Path $androidRoot "app\src\main\res"
  New-Item -ItemType Directory -Path $mainAssets -Force | Out-Null
  Copy-Item -LiteralPath $bundlePath -Destination (Join-Path $mainAssets "index.android.bundle") -Force
  Copy-Item -Path (Join-Path $resourcePath "*") -Destination $mainRes -Recurse -Force

  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
  $env:NODE_ENV = "production"

  & (Join-Path $androidRoot "gradlew.bat") -p $androidRoot assembleDebug "-PreactNativeArchitectures=$Architecture" --console=plain --no-daemon

  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $androidRoot "app\build\outputs\apk\debug\app-debug.apk") -Destination $outputApk -Force

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($outputApk)
  try {
    $bundle = $zip.Entries | Where-Object { $_.FullName -eq "assets/index.android.bundle" } | Select-Object -First 1
    if (-not $bundle) {
      throw "APK was built but does not contain assets/index.android.bundle"
    }
  } finally {
    $zip.Dispose()
  }

  Write-Output "Presentation APK created: $outputApk"
} finally {
  try {
    $null = git -C $repoRoot worktree remove --force $BuildPath 2>&1
  } catch {
    # Git can unregister the worktree while Windows rejects a long-path cleanup.
  }
  try {
    if (Test-Path -LiteralPath $BuildPath) {
      Remove-Item -LiteralPath "\\?\$BuildPath" -Recurse -Force -ErrorAction SilentlyContinue
    }
  } catch {
    # A leftover temporary directory must not turn a successful APK build into a failure.
  }
}
