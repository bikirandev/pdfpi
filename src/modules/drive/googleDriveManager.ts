import { google, drive_v3 } from "googleapis";
import { readFileSync } from "fs";
import { basename } from "path";
import { Readable } from "stream";
import config from "../../config";
import { loadDriveConfig, isDriveSetupDone } from "./driveConfigManager";

/**
 * Uploads a local file to Google Drive using a Service Account.
 *
 * Configuration is resolved in order:
 *   1. File-based config saved via the Setup UI (`/home/node/.pdfpi/drive-config.json`)
 *   2. Environment variables (GOOGLE_SERVICE_ACCOUNT_KEY_PATH + GOOGLE_DRIVE_FOLDER_ID)
 */
async function uploadToGoogleDrive(
  filePath: string,
  mimeType = "application/pdf",
): Promise<drive_v3.Schema$File> {
  const { auth, folderId } = resolveCredentials();

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
      body: Readable.from(fileBuffer),
    },
    fields: "id, name, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  return response.data;
}

/**
 * Resolves Google auth + folder ID from file config or env vars.
 */
function resolveCredentials(): {
  auth: InstanceType<typeof google.auth.GoogleAuth>;
  folderId: string;
} {
  // 1. Try file-based config first
  const fileCfg = loadDriveConfig();
  if (fileCfg) {
    const auth = new google.auth.GoogleAuth({
      credentials: fileCfg.serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    return { auth, folderId: fileCfg.folderId };
  }

  // 2. Fall back to env vars
  const keyPath = config.googleServiceAccountKeyPath;
  const folderId = config.googleDriveFolderId;

  if (!keyPath) {
    throw new Error(
      "Google Drive upload failed: no configuration found. Run the Setup UI or set GOOGLE_SERVICE_ACCOUNT_KEY_PATH.",
    );
  }
  if (!folderId) {
    throw new Error(
      "Google Drive upload failed: GOOGLE_DRIVE_FOLDER_ID is not configured.",
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return { auth, folderId };
}

/** Returns `true` when Drive is configured via either file or env vars. */
function isGoogleDriveConfigured(): boolean {
  if (isDriveSetupDone()) return true;
  return !!(config.googleServiceAccountKeyPath && config.googleDriveFolderId);
}

export { uploadToGoogleDrive, isGoogleDriveConfigured };
