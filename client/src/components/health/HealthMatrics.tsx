"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface HealthMetricsProps {
  data: {
    labels: string[];
    values: number[];
    label: string;
    color: string;
  };
}

export function HealthMetrics({ data }: HealthMetricsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Reset canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw chart
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find min and max values
    const minValue = Math.min(...data.values) * 0.9;
    const maxValue = Math.max(...data.values) * 1.1;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8"; // slate-400
    ctx.lineWidth = 1;

    // X-axis
    ctx.moveTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);

    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.stroke();

    // Draw data points and lines
    ctx.beginPath();
    ctx.strokeStyle = data.color;
    ctx.lineWidth = 2;

    data.values.forEach((value, index) => {
      const x = padding + (index / (data.values.length - 1)) * chartWidth;
      const y =
        rect.height -
        padding -
        ((value - minValue) / (maxValue - minValue)) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Draw data point
      ctx.fillStyle = data.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw x-axis label
      ctx.fillStyle = "#64748b"; // slate-500
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        data.labels[index].split("/")[1] || "",
        x,
        rect.height - padding + 15
      );
    });

    ctx.stroke();

    // Draw y-axis labels
    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";

    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
      const value = minValue + (i / numYLabels) * (maxValue - minValue);
      const y = rect.height - padding - (i / numYLabels) * chartHeight;
      ctx.fillText(Math.round(value).toString(), padding - 5, y + 3);
    }

    // Draw chart title
    ctx.fillStyle = "#334155"; // slate-700
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.label, rect.width / 2, 20);
  }, [data]);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">{data.label}</h3>
      </div>
      <div className={cn("relative w-full", "h-[200px]")}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </Card>
  );
}
