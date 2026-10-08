[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$c = New-Object System.Data.SqlClient.SqlConnection("Server=.\SQLEXPRESS;Database=UniMindDb;Integrated Security=True;")
$c.Open()
$cmd = $c.CreateCommand()
$cmd.CommandText = "SELECT FullName, Faculty, AnonymousCode FROM Users WHERE Email = 'expert@unimind.edu.vn'"
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    Write-Host ("NAME: " + $r["FullName"])
    Write-Host ("FACULTY: " + $r["Faculty"])
}
$c.Close()
