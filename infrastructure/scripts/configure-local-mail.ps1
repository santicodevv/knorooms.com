# Configura exclusivamente el buzón local. Nunca imprime claves.
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$configPath = Join-Path $projectRoot 'backend/src/Knorooms.Api/appsettings.Local.json'
$config = if (Test-Path -LiteralPath $configPath) { Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json -AsHashtable } else { @{} }
if (-not $config.ContainsKey('Invitations')) { $config['Invitations'] = @{} }
$settings = $config['Invitations']
if (-not $settings['SigningKey']) { $settings['SigningKey'] = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) }
$settings['BaseDomain'] = 'localhost:3000'
$settings['Scheme'] = 'http'
$settings['Provider'] = 'Smtp'
$settings['SmtpHost'] = '127.0.0.1'
$settings['SmtpPort'] = 1025
$settings['SmtpEnableSsl'] = $false
$settings['SmtpUsername'] = ''
$settings['SmtpPassword'] = ''
$settings['FromAddress'] = 'invitaciones@knorooms.local'
[IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 15), [Text.UTF8Encoding]::new($false))
Write-Output 'Correo local configurado. Reinicie la API en Development. Buzón: http://localhost:8025'
