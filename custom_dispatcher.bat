
curl.exe -i -X POST ^
  -H "Accept: application/vnd.github+json" ^
  -H "Authorization: Bearer %GH_DISPATCH_TOKEN%" ^
  -H "Content-Type: application/json" ^
  "https://api.github.com/repos/RafaelTorresLopez/GitHubCert/dispatches" ^
  -d "{\"event_type\":\"run-tests\",\"client_payload\":{\"env\":\"staging\"}}"
