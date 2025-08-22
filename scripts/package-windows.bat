@echo off
echo ===============================================
echo TaskFlow Windows Packaging Script
echo ===============================================

set BUILD_DIR=dist-windows
set ARCHIVE_NAME=TaskFlow-Windows-%date:~-4,4%-%date:~-7,2%-%date:~-10,2%.zip

echo Creating build directory...
if exist %BUILD_DIR% rmdir /s /q %BUILD_DIR%
mkdir %BUILD_DIR%

echo Copying application files...
xcopy /s /e /q server %BUILD_DIR%\server\
xcopy /s /e /q client %BUILD_DIR%\client\
xcopy /s /e /q shared %BUILD_DIR%\shared\

copy package.json %BUILD_DIR%\
copy package-lock.json %BUILD_DIR%\
copy tsconfig.json %BUILD_DIR%\
copy drizzle.config.ts %BUILD_DIR%\
copy vite.config.ts %BUILD_DIR%\
copy tailwind.config.ts %BUILD_DIR%\
copy postcss.config.js %BUILD_DIR%\
copy components.json %BUILD_DIR%\
copy .env.example %BUILD_DIR%\
copy README.md %BUILD_DIR%\

echo Creating installation scripts...

echo @echo off > %BUILD_DIR%\install.bat
echo echo ============================================== >> %BUILD_DIR%\install.bat
echo echo TaskFlow Installation >> %BUILD_DIR%\install.bat
echo echo ============================================== >> %BUILD_DIR%\install.bat
echo echo. >> %BUILD_DIR%\install.bat
echo echo Installing dependencies... >> %BUILD_DIR%\install.bat
echo call npm install >> %BUILD_DIR%\install.bat
echo echo. >> %BUILD_DIR%\install.bat
echo echo Building application... >> %BUILD_DIR%\install.bat
echo call npm run build >> %BUILD_DIR%\install.bat
echo echo. >> %BUILD_DIR%\install.bat
echo echo Creating environment file... >> %BUILD_DIR%\install.bat
echo if not exist .env copy .env.example .env >> %BUILD_DIR%\install.bat
echo echo. >> %BUILD_DIR%\install.bat
echo echo ============================================== >> %BUILD_DIR%\install.bat
echo echo Installation completed! >> %BUILD_DIR%\install.bat
echo echo ============================================== >> %BUILD_DIR%\install.bat
echo echo Next steps: >> %BUILD_DIR%\install.bat
echo echo 1. Edit .env file with your database URL >> %BUILD_DIR%\install.bat
echo echo 2. Run: npm run db:push >> %BUILD_DIR%\install.bat
echo echo 3. Run: start.bat >> %BUILD_DIR%\install.bat
echo echo. >> %BUILD_DIR%\install.bat
echo pause >> %BUILD_DIR%\install.bat

echo @echo off > %BUILD_DIR%\start.bat
echo title TaskFlow Server >> %BUILD_DIR%\start.bat
echo echo Starting TaskFlow Server... >> %BUILD_DIR%\start.bat
echo echo Press Ctrl+C to stop >> %BUILD_DIR%\start.bat
echo echo. >> %BUILD_DIR%\start.bat
echo call npm start >> %BUILD_DIR%\start.bat
echo pause >> %BUILD_DIR%\start.bat

echo @echo off > %BUILD_DIR%\install-service.bat
echo echo Installing TaskFlow as Windows Service... >> %BUILD_DIR%\install-service.bat
echo npm install -g pm2 >> %BUILD_DIR%\install-service.bat
echo npm install -g pm2-windows-service >> %BUILD_DIR%\install-service.bat
echo call pm2-service-install >> %BUILD_DIR%\install-service.bat
echo call pm2 start npm --name "TaskFlow" -- start >> %BUILD_DIR%\install-service.bat
echo call pm2 save >> %BUILD_DIR%\install-service.bat
echo echo TaskFlow service installed! >> %BUILD_DIR%\install-service.bat
echo pause >> %BUILD_DIR%\install-service.bat

echo Creating deployment guide...
echo # TaskFlow Windows Deployment > %BUILD_DIR%\DEPLOYMENT.md
echo. >> %BUILD_DIR%\DEPLOYMENT.md
echo ## Quick Start >> %BUILD_DIR%\DEPLOYMENT.md
echo. >> %BUILD_DIR%\DEPLOYMENT.md
echo 1. Install Node.js 18+ and PostgreSQL 14+ >> %BUILD_DIR%\DEPLOYMENT.md
echo 2. Run install.bat >> %BUILD_DIR%\DEPLOYMENT.md
echo 3. Edit .env file with database credentials >> %BUILD_DIR%\DEPLOYMENT.md
echo 4. Run: npm run db:push >> %BUILD_DIR%\DEPLOYMENT.md
echo 5. Run: start.bat >> %BUILD_DIR%\DEPLOYMENT.md
echo. >> %BUILD_DIR%\DEPLOYMENT.md
echo ## Default Login >> %BUILD_DIR%\DEPLOYMENT.md
echo Username: administrator >> %BUILD_DIR%\DEPLOYMENT.md
echo Password: wdq@#$ >> %BUILD_DIR%\DEPLOYMENT.md

echo Creating archive...
powershell Compress-Archive -Path %BUILD_DIR%\* -DestinationPath %ARCHIVE_NAME% -Force

echo ===============================================
echo Packaging completed successfully!
echo ===============================================
echo Archive: %ARCHIVE_NAME%
echo Build directory: %BUILD_DIR%
echo.
echo To deploy on Windows Server:
echo 1. Copy %ARCHIVE_NAME% to the server
echo 2. Extract the archive
echo 3. Run install.bat
echo 4. Configure .env file
echo 5. Run start.bat
echo.
pause