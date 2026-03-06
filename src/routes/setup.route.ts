import { NextFunction, Request, Response, Router } from "express";
import { google } from "googleapis";
import { Readable } from "stream";
import {
  isDriveSetupDone,
  loadDriveConfig,
  saveDriveConfig,
} from "../modules/drive/driveConfigManager";

const setupRoute = Router();

// ── Guard: block all /setup/* after configuration is saved ──
setupRoute.use((req: Request, res: Response, next: NextFunction): any => {
  if (isDriveSetupDone()) {
    return res.status(403).json({
      error: true,
      message: "Google Drive is already configured. Setup is locked.",
    });
  }
  next();
});

/**
 * POST /api/setup/drive/test
 *
 * Validates the provided service-account key + folder ID by listing the
 * folder contents (requires the folder to be shared with the SA email).
 */
setupRoute.post(
  "/drive/test",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { serviceAccountKey, folderId } = req.body;

      if (
        !serviceAccountKey ||
        typeof serviceAccountKey !== "object" ||
        !serviceAccountKey.client_email
      ) {
        return res.status(400).json({
          error: true,
          message:
            "Invalid service account key JSON. Must contain client_email.",
        });
      }
      if (!folderId || typeof folderId !== "string") {
        return res.status(400).json({
          error: true,
          message: "folderId is required.",
        });
      }

      // Build auth from the key object directly
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const drive = google.drive({ version: "v3", auth });

      // Quick write/delete test: create a tiny temp file then remove it.
      // We skip files.get() on the folder because `drive.file` scope only
      // allows access to files created/opened by the app, not pre-existing folders.
      const testFile = await drive.files.create({
        requestBody: {
          name: ".pdfapi-connection-test",
          parents: [folderId],
          mimeType: "text/plain",
        },
        media: {
          mimeType: "text/plain",
          body: Readable.from(Buffer.from("ok")),
        },
        fields: "id",
        supportsAllDrives: true,
      });

      if (testFile.data.id) {
        await drive.files.delete({
          fileId: testFile.data.id,
          supportsAllDrives: true,
        });
      }

      return res.json({
        error: false,
        message: "Connection successful!",
        folder: { id: folderId },
      });
    } catch (err: any) {
      console.error("Drive test error:", err);
      const detail = err?.errors?.[0]?.message || err.message;
      return res.status(400).json({
        error: true,
        message: `Connection failed: ${detail}`,
      });
    }
  },
);

/**
 * POST /api/setup/drive
 *
 * Persists the Google Drive configuration to disk. After this call the
 * /setup/* routes become locked (403).
 */
setupRoute.post("/drive", async (req: Request, res: Response): Promise<any> => {
  try {
    const { serviceAccountKey, folderId } = req.body;

    if (
      !serviceAccountKey ||
      typeof serviceAccountKey !== "object" ||
      !serviceAccountKey.client_email
    ) {
      return res.status(400).json({
        error: true,
        message: "Invalid service account key JSON. Must contain client_email.",
      });
    }
    if (!folderId || typeof folderId !== "string") {
      return res
        .status(400)
        .json({ error: true, message: "folderId is required." });
    }

    saveDriveConfig({
      folderId,
      serviceAccountKey,
      configuredAt: new Date().toISOString(),
    });

    return res.json({
      error: false,
      message: "Google Drive configuration saved successfully.",
    });
  } catch (err: any) {
    console.error("Drive save error:", err);
    return res.status(500).json({
      error: true,
      message: `Failed to save configuration: ${err.message}`,
    });
  }
});

export default setupRoute;
