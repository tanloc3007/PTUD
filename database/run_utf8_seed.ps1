$conn = New-Object System.Data.SqlClient.SqlConnection("Server=.\SQLEXPRESS;Database=UniMindDb;Integrated Security=True;")
$conn.Open()
$sql = [System.IO.File]::ReadAllText("c:\PTUD\PTUD\database\seed_data.sql", [System.Text.Encoding]::UTF8)
$batches = $sql -split "(?m)^\s*GO\s*$"
foreach ($b in $batches) {
    $trimmed = $b.Trim()
    if ($trimmed.Length -gt 0) {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $trimmed
        [void]$cmd.ExecuteNonQuery()
    }
}
$conn.Close()
Write-Host "Done UTF-8 seed via ADO.NET"
