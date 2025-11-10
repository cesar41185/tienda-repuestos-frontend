Param(
    [switch]$SkipInstall,
    [string]$ApiUrl,
    [string]$ListenHost = '0.0.0.0',
    [int]$Port = 5173,
    [switch]$OpenFirewall,
    [switch]$UseLocalIP
)
Write-Host "[Frontend] Iniciando script..." -ForegroundColor Cyan

# Asegurar que estamos en la carpeta del frontend aunque se llame desde otro directorio
Set-Location -Path $PSScriptRoot
Write-Host "[Frontend] Directorio actual: $(Get-Location)" -ForegroundColor DarkGray

if (-not $SkipInstall) {
    if (-not (Test-Path "node_modules")) {
        Write-Host "[Frontend] Instalando dependencias npm..." -ForegroundColor Yellow
        npm install
    } else {
        Write-Host "[Frontend] Dependencias ya instaladas (usa -SkipInstall para saltar esta verificación)." -ForegroundColor DarkYellow
    }
}

function Get-LocalLanIP {
    try {
        $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
            Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01]))' -and $_.InterfaceOperationalStatus -eq 'Up' } |
            Select-Object -ExpandProperty IPAddress
        if ($ips -and $ips.Count -gt 0) { return $ips[0] }
    } catch {}
    return $null
}

if ($UseLocalIP -and -not $ApiUrl) {
    $ip = Get-LocalLanIP
    if ($ip) {
        $ApiUrl = "http://$ip:8000/api"
        Write-Host "[Frontend] Detectado IP local: $ip" -ForegroundColor DarkGray
    } else {
        Write-Host "[Frontend] No se pudo detectar IP local, usando localhost para API." -ForegroundColor DarkYellow
    }
}

if ($ApiUrl) {
    $env:VITE_API_URL = $ApiUrl
    Write-Host "[Frontend] VITE_API_URL override (sólo para esta sesión): $ApiUrl" -ForegroundColor Green
} else {
    if (Test-Path ".env.local") {
        Write-Host "[Frontend] Usando variables de entorno de .env.local" -ForegroundColor Green
    } else {
        Write-Host "[Frontend] ADVERTENCIA: .env.local no existe. Creando archivo básico..." -ForegroundColor Yellow
        "VITE_API_URL=http://localhost:8000/api" | Out-File -FilePath .env.local -Encoding UTF8
    }
}

if ($OpenFirewall) {
    try {
        Write-Host "[Frontend] Abriendo puerto $Port en el firewall de Windows (si es necesario)..." -ForegroundColor Yellow
        netsh advfirewall firewall add rule name="Vite Dev $Port" dir=in action=allow protocol=TCP localport=$Port | Out-Null
    } catch {
        Write-Host "[Frontend] No se pudo crear la regla de firewall (¿permisos de administrador?)." -ForegroundColor DarkYellow
    }
}

$urlHost = if ($ListenHost -eq '0.0.0.0') { 'localhost' } else { $ListenHost }
Write-Host "[Frontend] Iniciando Vite en http://$($urlHost):$Port (host=$ListenHost)" -ForegroundColor Green
# Pasar parámetros a Vite para escuchar en todas las interfaces
npm run dev -- --host $ListenHost --port $Port
