@echo off
chcp 65001 >nul
title FESTIVA — Installation

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     🏛  FESTIVA — Installation           ║
echo  ║     Gestion Salle des Fêtes              ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Node.js n'est pas installé.
    echo     Téléchargez-le sur https://nodejs.org
    echo     Version recommandée: 18.x ou 20.x LTS
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  ✅ Node.js détecté: %NODE_VER%
echo.

:: Install dependencies
echo  📦 Installation des dépendances...
echo     (Cela peut prendre 2-5 minutes la première fois)
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Erreur lors de l'installation
    pause
    exit /b 1
)

echo.
echo  ✅ Installation terminée !
echo.
echo  🚀 Lancement de FESTIVA...
echo.
call npm run electron-dev

pause
