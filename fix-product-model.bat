@echo off
REM ============================================
REM Automatic Product.js Fixer for Windows
REM ============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║   BLOOMZON PRODUCT.JS AUTO-FIXER         ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check if Product.js exists
if not exist "src\models\Product.js" (
    echo ❌ ERROR: src\models\Product.js not found!
    echo.
    echo Please make sure you're in the correct directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo 📋 Current Product.js found at: src\models\Product.js
echo.

REM Create backup
echo 💾 Creating backup...
copy "src\models\Product.js" "src\models\Product.js.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backup created successfully!
) else (
    echo ❌ Failed to create backup!
    pause
    exit /b 1
)
echo.

REM Check if fixed version exists
if not exist "fixed-Product-model.js" (
    echo ❌ ERROR: fixed-Product-model.js not found!
    echo.
    echo Please download the fixed-Product-model.js file first.
    pause
    exit /b 1
)

echo 🔧 Applying fix...
copy /Y "fixed-Product-model.js" "src\models\Product.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Fix applied successfully!
) else (
    echo ❌ Failed to apply fix!
    echo.
    echo Restoring backup...
    copy /Y "src\models\Product.js.backup.*" "src\models\Product.js" >nul
    pause
    exit /b 1
)
echo.

echo ════════════════════════════════════════════
echo.
echo ✅ Product.js has been fixed!
echo.
echo 📝 Changes made:
echo    - Added next() calls to all pre-save middleware
echo    - Fixed categorySchema at line ~405
echo    - All 5 pre-save hooks now properly call next()
echo.
echo 💾 Backup saved as: Product.js.backup.YYYYMMDD_HHMMSS
echo.
echo ════════════════════════════════════════════
echo.
echo 🚀 Ready to test!
echo.
echo Run this command to seed the database:
echo    node seedDatabase.js
echo.
echo ════════════════════════════════════════════
echo.
pause