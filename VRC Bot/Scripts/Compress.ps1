$Compress = @{
    LiteralPath= "VerificationBot.exe", "..\Commands", "..\Interactions"
    DestinationPath = "..\Build\Release.zip"
    Force= $True
}
Compress-Archive @Compress