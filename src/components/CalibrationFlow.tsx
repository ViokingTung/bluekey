import { useState, useEffect } from "react";
import { X, ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "./ui/Button";
import { SignalBars } from "./ui/SignalBars";
import { useTranslation } from "../lib/i18n";
import type { PairedDevice, CalibrationData } from "../types/bluetooth";

export interface CalibrationFlowProps {
  device: PairedDevice;
  onClose: () => void;
  onComplete: (device: PairedDevice, calibration: CalibrationData) => void;
}

type CalibrationStep = "intro" | "measure" | "confirm" | "complete";

export function CalibrationFlow({ device, onClose, onComplete }: CalibrationFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<CalibrationStep>("intro");
  const [countdown, setCountdown] = useState(10);
  const [samples, setSamples] = useState<number[]>([]);
  const [currentRssi, setCurrentRssi] = useState(-60);

  // Simulate RSSI measurement during calibration
  useEffect(() => {
    if (step === "measure" && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((c) => c - 1);
        // Simulate RSSI readings
        const newRssi = -60 + Math.floor(Math.random() * 20 - 10);
        setCurrentRssi(newRssi);
        setSamples((s) => [...s, newRssi]);
      }, 1000);
      return () => clearInterval(timer);
    } else if (step === "measure" && countdown === 0) {
      // Transition to confirm step when countdown finishes
      setStep("confirm");
    }
  }, [step, countdown]);

  const handleStartCalibration = () => {
    setStep("measure");
    setCountdown(10);
    setSamples([]);
  };

  const handleRetake = () => {
    setStep("intro");
    setCountdown(10);
    setSamples([]);
  };

  const handleConfirm = () => {
    const avgRssi = samples.reduce((a, b) => a + b, 0) / samples.length;
    const calibration: CalibrationData = {
      rssi_1m: Math.round(avgRssi),
      path_loss_exponent: 2.0,
      samples: samples.length,
    };
    onComplete(device, calibration);
    setStep("complete");
  };

  const avgRssi = samples.length > 0 ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
          <h2 className="font-display font-semibold text-sm">{t("calibration.title")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "intro" && (
            <IntroStep device={device} onStart={handleStartCalibration} t={t} />
          )}

          {step === "measure" && (
            <MeasureStep
              device={device}
              countdown={countdown}
              currentRssi={currentRssi}
              samplesCount={samples.length}
              t={t}
            />
          )}

          {step === "confirm" && (
            <ConfirmStep
              avgRssi={avgRssi}
              samplesCount={samples.length}
              onConfirm={handleConfirm}
              onRetake={handleRetake}
              t={t}
            />
          )}

          {step === "complete" && (
            <CompleteStep device={device} avgRssi={avgRssi} onClose={onClose} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

// Intro Step
interface IntroStepProps {
  device: PairedDevice;
  onStart: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function IntroStep({ device, onStart, t }: IntroStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
        <span className="text-3xl">📏</span>
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-semibold">{t("calibration.calibrate")} {device.name}</h3>
        <p className="text-sm text-text-muted">
          {t("calibration.introHint")}
        </p>
      </div>

      <div className="bg-surface/50 rounded-lg p-4 text-left space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">1</span>
          <span>{t("calibration.step1", { device: device.name })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">2</span>
          <span>{t("calibration.step2")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">3</span>
          <span>{t("calibration.step3")}</span>
        </div>
      </div>

      <Button onClick={onStart} className="w-full">
        {t("calibration.start")}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// Measure Step
interface MeasureStepProps {
  device: PairedDevice;
  countdown: number;
  currentRssi: number;
  samplesCount: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function MeasureStep({ device, countdown, currentRssi, samplesCount, t }: MeasureStepProps) {
  const progress = ((10 - countdown) / 10) * 100;

  return (
    <div className="text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        {/* Progress ring */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="4"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="4"
            strokeDasharray={`${progress * 2.76} 276`}
            className="transition-all duration-300"
          />
        </svg>
        {/* Countdown */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-accent">{countdown}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-semibold">{t("calibration.measuring")}</h3>
        <p className="text-sm text-text-muted">
          {t("calibration.keepStill", { device: device.name })}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <SignalBars rssi={currentRssi} size="lg" animated />
          <p className="text-xs text-text-muted mt-2">{t("calibration.currentSignal")}</p>
          <p className="font-mono text-sm">{currentRssi}dBm</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-accent">{samplesCount}</div>
          <p className="text-xs text-text-muted mt-1">{t("calibration.samples")}</p>
        </div>
      </div>

      <div className="text-xs text-text-muted">
        {t("calibration.measuringHint")}
      </div>
    </div>
  );
}

// Confirm Step
interface ConfirmStepProps {
  avgRssi: number;
  samplesCount: number;
  onConfirm: () => void;
  onRetake: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function ConfirmStep({ avgRssi, samplesCount, onConfirm, onRetake, t }: ConfirmStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
        <Check className="w-8 h-8 text-success" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-semibold">{t("calibration.complete")}</h3>
        <p className="text-sm text-text-muted">
          {t("calibration.collected", { count: samplesCount })}
        </p>
      </div>

      <div className="bg-surface/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">{t("calibration.rssi1m")}</span>
          <span className="font-mono text-lg text-accent">{avgRssi}dBm</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetake} className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t("calibration.retake")}
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          {t("calibration.confirm")}
        </Button>
      </div>
    </div>
  );
}

// Complete Step
interface CompleteStepProps {
  device: PairedDevice;
  avgRssi: number;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function CompleteStep({ device, avgRssi, onClose, t }: CompleteStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center animate-success-pulse">
        <Check className="w-8 h-8 text-success" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-semibold">{t("calibration.done")}</h3>
        <p className="text-sm text-text-muted">
          {t("calibration.optimized", { device: device.name })}
        </p>
      </div>

      <div className="bg-surface/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">{t("calibration.calibrationInfo")}</span>
          <span className="font-mono text-accent">{avgRssi}dBm @ 1m</span>
        </div>
      </div>

      <Button onClick={onClose} className="w-full">
        {t("calibration.done")}
      </Button>
    </div>
  );
}
