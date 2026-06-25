@echo off
chcp 65001 >nul
title FESTIVA — Build Windows

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     🏛  FESTIVA — Build Installateur     ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  📦 Compilation en cours...
echo     (Cela peut prendre 5-10 minutes)
echo.

call npm run electron-build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Erreur lors du build
    pause
    exit /b 1
)

echo.
echo  ✅ Build terminé !
echo  📁 L'installateur se trouve dans le dossier: dist\
echo.
pause
