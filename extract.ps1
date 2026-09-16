Add-Type -AssemblyName System.IO.Compression.FileSystem

$files = Get-ChildItem -Path . -Filter "*.docx"
foreach ($f in $files) {
    $outName = "docs/" + $f.BaseName + ".txt"
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
        $entry = $zip.GetEntry('word/document.xml')
        if ($entry) {
            $stream = $entry.Open()
            $reader = New-Object System.IO.StreamReader($stream)
            $xml = $reader.ReadToEnd()
            $reader.Close()
            $stream.Close()
            $text = [System.Text.RegularExpressions.Regex]::Replace($xml, '<w:p[^>]*>', "`r`n")
            $text = [System.Text.RegularExpressions.Regex]::Replace($text, '<[^>]+>', '')
            [System.IO.File]::WriteAllText($outName, $text, [System.Text.Encoding]::UTF8)
            Write-Host "Extracted $($f.Name) -> $outName"
        }
        $zip.Dispose()
    } catch {
        Write-Host "Error extracting $($f.Name): $_"
    }
}
