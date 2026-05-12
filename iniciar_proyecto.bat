@echo off
color 0B
echo ========================================================
echo        IMPORTACIONES GT - INICIO DEL ROBOT
echo ========================================================
echo.
echo Iniciando el servidor local del Robot...
echo (Este es el motor que busca precios en Amazon)
echo.
start "Servidor Robot - No Cerrar" cmd /k "cd server && node index.js"

echo.
echo ========================================================
echo ¡LISTO! El servidor se esta ejecutando en segundo plano.
echo Manten la ventana negra abierta para que el robot funcione.
echo ========================================================
echo.
pause
