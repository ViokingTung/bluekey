import { useState, useEffect } from "react";
import { Settings, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { getSettings, updateSettings, enableAutostart, disableAutostart, isAutostartEnabled, setLanguage as setLanguageApi } from "../api/bluetooth";
import { setLanguage, useTranslation } from "../lib/i18n";
import type { AppSettings as SettingsType } from "../types/bluetooth";

export function SettingsPanel() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const LANGUAGE_OPTIONS = [
    { value: "system", label: t("settings.languageSystem") },
    { value: "zh-CN", label: t("settings.languageZh") },
    { value: "en-US", label: t("settings.languageEn") },
  ] as const;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getSettings();
      setSettings(s);
      // Check actual autostart state from OS
      const autostart = await isAutostartEnabled();
      setAutostartEnabled(autostart);
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutostart = async () => {
    setSaving(true);
    try {
      if (autostartEnabled) {
        await disableAutostart();
        setAutostartEnabled(false);
      } else {
        await enableAutostart();
        setAutostartEnabled(true);
      }
    } catch (e) {
      console.error("Failed to toggle autostart:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<SettingsType>) => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = { ...settings, ...newSettings };
      await updateSettings(updated);
      setSettings(updated);
    } catch (e) {
      console.error("Failed to update settings:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-text-muted">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-danger">
          {t("common.error")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {t("settings.title")}
        </CardTitle>
        <CardDescription>
          {t("settings.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Autostart */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-text font-medium">{t("settings.autostart")}</h4>
            <p className="text-text-muted text-sm">
              {t("settings.autostartHint")}
            </p>
          </div>
          <button
            onClick={handleToggleAutostart}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-surface-hover"
          >
            {autostartEnabled ? (
              <>
                <ToggleRight className="w-6 h-6 text-success" />
                <span className="text-success text-sm">{t("common.enabled")}</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-text-muted" />
                <span className="text-text-muted text-sm">{t("common.disabled")}</span>
              </>
            )}
          </button>
        </div>

        {/* Unlock Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-text font-medium">{t("settings.unlockDistance")}</h4>
            <span className="text-primary font-mono">{settings.default_unlock_range}{t("common.meters")}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={settings.default_unlock_range}
            onChange={(e) => handleUpdateSettings({ default_unlock_range: parseFloat(e.target.value) })}
            disabled={saving}
            className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-text-muted text-sm">
            {t("settings.unlockDistanceHint")}
          </p>
        </div>

        {/* Lock Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-text font-medium">{t("settings.lockDistance")}</h4>
            <span className="text-primary font-mono">{settings.default_lock_range}{t("common.meters")}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={settings.default_lock_range}
            onChange={(e) => handleUpdateSettings({ default_lock_range: parseFloat(e.target.value) })}
            disabled={saving}
            className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-text-muted text-sm">
            {t("settings.lockDistanceHint")}
          </p>
        </div>

        {/* Unlock Delay */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-text font-medium">{t("settings.unlockDelay")}</h4>
            <span className="text-primary font-mono">{settings.unlock_delay}{t("common.seconds")}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={settings.unlock_delay}
            onChange={(e) => handleUpdateSettings({ unlock_delay: parseInt(e.target.value) })}
            disabled={saving}
            className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-text-muted text-sm">
            {t("settings.unlockDelayHint")}
          </p>
        </div>

        {/* Lock Delay */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-text font-medium">{t("settings.lockDelay")}</h4>
            <span className="text-primary font-mono">{settings.lock_delay}{t("common.seconds")}</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={settings.lock_delay}
            onChange={(e) => handleUpdateSettings({ lock_delay: parseInt(e.target.value) })}
            disabled={saving}
            className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-text-muted text-sm">
            {t("settings.lockDelayHint")}
          </p>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-text font-medium">{t("settings.notifications")}</h4>
            <p className="text-text-muted text-sm">
              {t("settings.notificationsHint")}
            </p>
          </div>
          <button
            onClick={() => handleUpdateSettings({ notifications_enabled: !settings.notifications_enabled })}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-surface-hover"
          >
            {settings.notifications_enabled ? (
              <>
                <ToggleRight className="w-6 h-6 text-success" />
                <span className="text-success text-sm">{t("common.enabled")}</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-text-muted" />
                <span className="text-text-muted text-sm">{t("common.disabled")}</span>
              </>
            )}
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h4 className="text-text font-medium">{t("settings.language")}</h4>
              <p className="text-text-muted text-sm">
                {t("settings.languageHint")}
              </p>
            </div>
          </div>
          <select
            value={settings.language || "system"}
            onChange={async (e) => {
              const newLang = e.target.value as SettingsType["language"];
              setSaving(true);
              try {
                await setLanguageApi(newLang);
                setLanguage(newLang);
                setSettings(prev => prev ? { ...prev, language: newLang } : null);
              } catch (err) {
                console.error("Failed to set language:", err);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-3 py-2 rounded-lg bg-surface border border-border-soft text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
