# Google Drive Setup Guide

This guide walks you through configuring the **7301N Web-to-PDF API** to
automatically save generated PDFs to a Google Drive folder using a
**Service Account** (no user-login required, fully server-side).

---

## Prerequisites

| Requirement    | Details                      |
| -------------- | ---------------------------- |
| Google account | Any Gmail / Google Workspace |
| Node.js        | Already running this project |
| Internet       | Server needs outbound HTTPS  |

---

## Step 1 – Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top-left) → **New Project**.
3. Name it (e.g. `web-to-pdf`) → **Create**.
4. Select the new project from the dropdown.

---

## Step 2 – Enable the Google Drive API

1. In the Cloud Console, go to **APIs & Services → Library**.
2. Search for **Google Drive API**.
3. Click it → **Enable**.

---

## Step 3 – Create a Service Account

1. Go to **APIs & Services → Credentials**.
2. Click **+ CREATE CREDENTIALS → Service account**.
3. Fill in:
   - **Name**: `web-to-pdf-uploader`
   - **ID**: auto-generated (e.g. `web-to-pdf-uploader@your-project.iam.gserviceaccount.com`)
4. Click **Create and Continue**.
5. Skip the optional role/permissions steps → **Done**.

---

## Step 4 – Generate a JSON Key

1. On the **Service Accounts** list, click your new service account.
2. Go to the **Keys** tab.
3. Click **Add Key → Create new key → JSON → Create**.
4. A `.json` file will download — save it in a secure location (e.g.
   `data/service-account-key.json` in the project root).

> **Security**: Never commit this file to version control. Add it to
> `.gitignore`.

---

## Step 5 – Create & Share a Drive Folder

1. Open [Google Drive](https://drive.google.com/).
2. Create a new folder (e.g. `Web-to-PDF Uploads`).
3. Right-click the folder → **Share**.
4. Paste the **service account email** (from Step 3, e.g.
   `web-to-pdf-uploader@your-project.iam.gserviceaccount.com`).
5. Set the role to **Editor** → **Send** (uncheck "Notify people" if prompted).
6. Open the folder — copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_IS_HERE
                                           ^^^^^^^^^^^^^^^^^^^
   ```

---

## Step 6 – Configure Environment Variables

Add these two variables to your `.env` file (or system environment):

```bash
# Path to the downloaded JSON key file (absolute or relative to project root)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./data/service-account-key.json

# The Google Drive folder ID from Step 5
GOOGLE_DRIVE_FOLDER_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

Restart the server after saving.

---

## Step 7 – Test

Generate a PDF with the `save=true` parameter:

```
GET /pdf/generate?url=https://example.com&id=test-001&size=A4&save=true
```

**Expected response:**

```json
{
  "error": false,
  "message": "PDF generated successfully",
  "pdfUrl": "/downloads/Example-1712345678.pdf",
  "drive": {
    "id": "1aBcDeFg...",
    "name": "Example-1712345678.pdf",
    "viewUrl": "https://drive.google.com/file/d/.../view",
    "downloadUrl": "https://drive.google.com/uc?id=...&export=download"
  }
}
```

Or use the **Playground UI** — check the **"Save to Google Drive"** toggle
before clicking Generate.

---

## Troubleshooting

| Problem                                             | Solution                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not configured` | Set the env var and restart the server.                                            |
| `GOOGLE_DRIVE_FOLDER_ID is not configured`          | Set the env var and restart the server.                                            |
| `403 Forbidden` / permission error                  | Make sure the Drive folder is shared with the service account email as **Editor**. |
| `404 File not found`                                | Double-check the Folder ID from the URL.                                           |
| `Google Drive API has not been used`                | Enable the Drive API in Cloud Console (Step 2).                                    |

---

## Security Notes

- The JSON key file grants full access to the service account — protect it
  like a password.
- The `drive.file` scope is used, so the service account can only access
  files it creates or that are explicitly shared with it.
- Add `data/service-account-key.json` to `.gitignore`.
