import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import config from "../../config";

/** Shape of the persisted Google Drive configuration. */
export interface IDriveConfig {
  folderId: string;
  serviceAccountKey: Record<string, any>;
  configuredAt: string;
}

/** Resolves the config directory, creating it if absent. */
function configDir(): string {
  const dir = config.configDir;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Full path to the drive config file. */
function configFilePath(): string {
  return join(configDir(), "drive-config.json");
}

/** Returns `true` when a saved Drive configuration exists on disk. */
function isDriveSetupDone(): boolean {
  return existsSync(configFilePath());
}

/** Reads the saved config. Returns `null` when no config file exists. */
function loadDriveConfig(): IDriveConfig | null {
  const fp = configFilePath();
  if (!existsSync(fp)) return null;
  try {
    const raw = readFileSync(fp, "utf-8");
    return JSON.parse(raw) as IDriveConfig;
  } catch {
    return null;
  }
}

/** Persists Drive configuration to disk. */
function saveDriveConfig(cfg: IDriveConfig): void {
  const fp = configFilePath();
  writeFileSync(fp, JSON.stringify(cfg, null, 2), "utf-8");
}

export { isDriveSetupDone, loadDriveConfig, saveDriveConfig, configDir };
