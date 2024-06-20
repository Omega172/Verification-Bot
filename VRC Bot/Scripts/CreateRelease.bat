@echo off
powershell -File Compress.ps1

del sea-prep.blob
del Bundle.js
del VerificationBot.exe