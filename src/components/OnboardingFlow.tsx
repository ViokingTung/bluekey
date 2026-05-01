import { useState } from "react";
import { 
  Bluetooth, 
  Shield, 
  Smartphone, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Radar,
  Zap,
  Lock,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";

export interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = "welcome" | "features" | "bluetooth" | "device" | "complete";

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const steps: OnboardingStep[] = ["welcome", "features", "bluetooth", "device", "complete"];
  const currentIndex = steps.indexOf(step);

  const goNext = () => {
    if (step === "complete") {
      onComplete();
      return;
    }
    setDirection("forward");
    setStep(steps[currentIndex + 1]);
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setDirection("backward");
      setStep(steps[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <WelcomeStep />;
      case "features":
        return <FeaturesStep />;
      case "bluetooth":
        return <BluetoothStep onNext={goNext} />;
      case "device":
        return <DeviceStep />;
      case "complete":
        return <CompleteStep />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === currentIndex
                ? "w-6 bg-accent"
                : i < currentIndex
                ? "bg-accent/60"
                : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div
          key={step}
          className={cn(
            "w-full max-w-md transition-all duration-300",
            direction === "forward"
              ? "animate-slide-in-right"
              : "animate-slide-in-left"
          )}
        >
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 border-t border-border-soft">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={currentIndex === 0}
          className={cn(currentIndex === 0 && "invisible")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回
        </Button>

        <Button onClick={goNext}>
          {step === "complete" ? "开始使用" : "继续"}
          {step !== "complete" && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}

// Welcome step
function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      {/* Logo */}
      <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-14 h-14 text-white" />
        </div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-[32px] border-2 border-accent animate-ping opacity-20" />
        <div className="absolute -inset-4 rounded-[40px] border border-accent/30 animate-ping opacity-10" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-display font-bold tracking-tight">
          BlueKey
        </h1>
        <p className="text-lg text-text-soft">
          智能蓝牙解锁助手
        </p>
      </div>

      <p className="text-sm text-text-muted max-w-xs mx-auto">
        让您的 Mac 在靠近时自动解锁，远离时自动锁定，安全又便捷
      </p>
    </div>
  );
}

// Features step
function FeaturesStep() {
  const features = [
    {
      icon: Zap,
      title: "自动解锁",
      description: "靠近 Mac 时自动解锁，无需手动输入密码",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      icon: Shield,
      title: "安全可靠",
      description: "蓝牙信号加密传输，支持距离验证",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Smartphone,
      title: "多设备支持",
      description: "支持手机、手表、耳机等多种蓝牙设备",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Radar,
      title: "精准定位",
      description: "校准后可精确控制解锁距离范围",
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">核心功能</h2>
        <p className="text-sm text-text-muted">了解 BlueKey 如何为您服务</p>
      </div>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 rounded-xl bg-surface/30 border border-border-soft"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", feature.bg)}>
              <feature.icon className={cn("w-5 h-5", feature.color)} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-text-muted mt-0.5">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bluetooth permission step
function BluetoothStep({ onNext }: { onNext: () => void }) {
  const [requesting, setRequesting] = useState(false);
  const [granted, setGranted] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    // Simulate permission request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGranted(true);
    setRequesting(false);
  };

  return (
    <div className="text-center space-y-6">
      <div className={cn(
        "w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-500",
        granted ? "bg-success/20" : "bg-accent/20"
      )}>
        {granted ? (
          <Check className="w-12 h-12 text-success" />
        ) : (
          <Bluetooth className={cn(
            "w-12 h-12 text-accent transition-transform",
            requesting && "animate-pulse"
          )} />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold">
          {granted ? "权限已授权" : "蓝牙权限"}
        </h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          {granted
            ? "BlueKey 已获得蓝牙访问权限，可以开始扫描设备"
            : "BlueKey 需要蓝牙权限来扫描和连接您的设备"}
        </p>
      </div>

      {!granted && (
        <Button
          size="lg"
          onClick={handleRequest}
          disabled={requesting}
          className="w-full"
        >
          {requesting ? "请求中..." : "授权蓝牙访问"}
        </Button>
      )}

      {granted && (
        <Button size="lg" onClick={onNext} className="w-full">
          继续
        </Button>
      )}
    </div>
  );
}

// Add first device step
function DeviceStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
        <Smartphone className="w-12 h-12 text-accent" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold">添加您的设备</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          开始使用前，请添加一个蓝牙设备作为解锁钥匙
        </p>
      </div>

      <div className="space-y-3 text-left">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/30">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
            1
          </div>
          <span className="text-sm">点击"添加设备"按钮</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/30">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
            2
          </div>
          <span className="text-sm">确保设备蓝牙已开启</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/30">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
            3
          </div>
          <span className="text-sm">从列表中选择并配对设备</span>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        支持 iPhone、Apple Watch、AirPods 等设备
      </p>
    </div>
  );
}

// Complete step
function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full bg-success/20 animate-success-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-12 h-12 text-success" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold">准备就绪！</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          您已完成初始设置，现在可以开始使用 BlueKey
        </p>
      </div>

      <div className="p-4 rounded-xl bg-surface/30 border border-border-soft text-left space-y-2">
        <p className="text-xs text-text-muted">💡 小提示</p>
        <ul className="text-xs text-text-soft space-y-1">
          <li>• 首次使用建议进行距离校准</li>
          <li>• 可在设置中调整解锁/锁定距离</li>
          <li>• 支持同时使用多个解锁设备</li>
        </ul>
      </div>
    </div>
  );
}
