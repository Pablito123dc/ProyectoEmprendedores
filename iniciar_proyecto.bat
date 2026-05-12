@echo off
color 0B
echo ========================================================
echo        IMPORTACIONES GT - INICIO AUTOMATICO DEL ROBOT
echo ========================================================
echo.
echo Este archivo encendera tu Robot Cotizador y creara un 
echo enlace publico para que tu pagina de GitHub pueda hablar
echo con tu computadora.
echo.
echo PASO 1: Iniciando el servidor local...
start "Servidor Robot - No Cerrar" cmd /k "cd server && node index.js"

echo Esperando 5 segundos a que el servidor encienda...
timeout /t 5 /nobreak > nul

echo.
echo PASO 2: Creando tu enlace de internet (Tunnel)...
echo --------------------------------------------------------
echo IMPORTANTE: Copia el link que termine en ".loca.lt"
echo y pegalo en tu archivo JS/carrito.js en la variable API_BASE
echo --------------------------------------------------------
start "Enlace Publico - No Cerrar" cmd /k "npx -y localtunnel --port 3000"

echo.
echo ========================================================
echo ¡LISTO! Se abrieron dos ventanas negras. 
echo Mantelas abiertas mientras quieras que el robot funcione.
echo ========================================================
pause
