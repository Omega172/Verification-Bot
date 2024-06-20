@echo off
rem https://notes.billmill.org/programming/javascript/Making_a_single-file_executable_with_node_and_esbuild.html
rem npm add --save-dev esbuild < To install esbuild
npx esbuild --format=cjs --target=node20 --platform=node --bundle --outfile=Bundle.js ../Main.mjs && GenerateBinairy.bat