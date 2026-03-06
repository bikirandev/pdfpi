import { google, drive_v3 } from "googleapis";
import { readFileSync } from "fs";
import { basename } from "path";
import config from "../../config";

/**
 * Uploads a local file to Google Drive using a Service Account.
 *
 * Requires:
 *   - GOOGLE_SERVICE_ACCOUNT_KEY_PATH  (path to the JSON key file)
 *   - GOOGLE_DRIVE_FOLDER_ID           (target Drive folder)
 */
async function uploadToGoogleDrive(
  filePath: string,
  mimeType = "application/pdf",
): Promise<drive_v3.Schema$File> {
  const keyPath = config.googleServiceAccountKeyPath;
  const folderId = config.googleDriveFolderId;

  if (!keyPath) {
    throw new Error(
      "Google Drive upload failed: GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not configured.",
    );
  }
  if (!folderId) {
    throw new Error(
      "Google Drive upload failed: GOOGLE_DRIVE_FOLDER_ID is not configured.",
    );
  }

  // Authenticate with a service-account key
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileName = basename(filePath);
  const fileBuffer = readFileSync(filePath);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: require("stream").Readable.from(fileBuffer),
    },
    fields: "id, name, webViewLink, webContentLink",
  });

  return response.data;
}

/** Returns `true` when both required env vars are set. */
function isGoogleDriveConfigured(): boolean {
  return !!(config.googleServiceAccountKeyPath && config.googleDriveFolderId);
}

export { uploadToGoogleDrive, isGoogleDriveConfigured };
