# Generaciones descartadas: Antigravity en modo por defecto

Estas 12 generaciones se descartaron porque Antigravity se ejecutó en modo por defecto ("--mode auto is not available for this account"). En modo sin interfaz, ese modo deniega cualquier comando que necesite permiso, así que el agente no pudo ejecutar `npx modern-web-guidance`, `npm` ni compilar. Los resultados no son comparables con Claude Code, que se ejecutó en modo auto y sí podía ejecutar comandos.

Se repitieron con `--dangerously-skip-permissions --sandbox`. Se conservan solo como registro del proceso.
