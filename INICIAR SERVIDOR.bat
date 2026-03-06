@echo off
title DIJ - Sistema de Matriculas 2026
echo.
echo  Iniciando servidor DIJ - GEDCC 2026...
echo  Aguarde...
echo.
cd /d "%~dp0"
node api/server.js
pause
