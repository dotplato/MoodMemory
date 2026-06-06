import { google } from "googleapis"

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
}

export function createDriveClient(accessToken: string) {
  const auth = createOAuth2Client()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: "v3", auth })
}
