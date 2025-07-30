import React, { useEffect, useRef } from "react";

interface Line {
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  targetOpacity: number;
  opacitySpeed: number;
  thickness: number;
  phase: number;
  moveSpeed: number;
}

const AnimatedGradient: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const lines: Line[] = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: 300 + Math.random() * 500,
      angle: Math.random() * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.003,
      opacity: 0,
      targetOpacity: 0,
      opacitySpeed: 0.02,
      thickness: 2 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
      moveSpeed: 0.5 + Math.random() * 1,
    }));

    const animate = (): void => {
      timeRef.current += 0.01;

      // Очистка canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Создание анимированного градиента с более заметными изменениями
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Более выраженное изменение цветов
      const time = timeRef.current;
      const hue1 = 220 + Math.sin(time * 0.03) * 40; // от голубого к фиолетовому
      const hue2 = 260 + Math.sin(time * 0.025 + 1) * 30;
      const hue3 = 290 + Math.sin(time * 0.02 + 2) * 25;

      const sat1 = 25 + Math.sin(time * 0.04) * 15; // изменение насыщенности
      const sat2 = 30 + Math.sin(time * 0.035) * 15;
      const sat3 = 35 + Math.sin(time * 0.03) * 15;

      gradient.addColorStop(0, `hsl(${hue1}, ${sat1}%, 90%)`);
      gradient.addColorStop(0.3, `hsl(${hue2}, ${sat2}%, 88%)`);
      gradient.addColorStop(0.7, `hsl(${hue3}, ${sat3}%, 86%)`);
      gradient.addColorStop(1, `hsl(${hue1 + 30}, ${sat1}%, 92%)`);

      // Рисование градиента
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Дополнительный слой с радиальным градиентом для глубины
      const radialGradient = ctx.createRadialGradient(
        canvas.width * 0.5 + Math.sin(time * 0.02) * 100,
        canvas.height * 0.5 + Math.cos(time * 0.015) * 100,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      );

      radialGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      radialGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      radialGradient.addColorStop(1, "rgba(200, 200, 255, 0.1)");

      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Рисование абстрактных линий
      lines.forEach((line: Line, index: number) => {
        // Обновление позиции с более заметным движением
        line.x += Math.sin(time * line.speed + line.phase) * line.moveSpeed;
        line.y +=
          Math.cos(time * line.speed * 0.7 + line.phase) * line.moveSpeed * 0.7;

        // Обновление угла
        line.angle += line.speed * 0.5;

        // Циклическое появление и исчезновение с большей амплитудой
        const cycleTime = time * 0.2 + index * 0.5;
        if (Math.sin(cycleTime) > 0) {
          line.targetOpacity = 0.1 + Math.sin(cycleTime) * 0.15;
        } else {
          line.targetOpacity = 0;
        }

        // Плавное изменение прозрачности
        line.opacity += (line.targetOpacity - line.opacity) * line.opacitySpeed;

        // Перемещение линий, если они выходят за границы
        if (line.x < -line.length) line.x = canvas.width + line.length;
        if (line.x > canvas.width + line.length) line.x = -line.length;
        if (line.y < -line.length) line.y = canvas.height + line.length;
        if (line.y > canvas.height + line.length) line.y = -line.length;

        // Рисование линии с эффектом свечения
        ctx.save();
        ctx.translate(line.x, line.y);
        ctx.rotate(line.angle);

        // Эффект свечения
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";

        // Создание градиента для линии
        const lineGradient = ctx.createLinearGradient(0, 0, line.length, 0);
        lineGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        lineGradient.addColorStop(
          0.2,
          `rgba(255, 255, 255, ${line.opacity * 0.5})`
        );
        lineGradient.addColorStop(0.5, `rgba(255, 255, 255, ${line.opacity})`);
        lineGradient.addColorStop(
          0.8,
          `rgba(255, 255, 255, ${line.opacity * 0.5})`
        );
        lineGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = line.thickness;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(line.length, 0);
        ctx.stroke();

        // Дополнительная тонкая линия для большей выразительности
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full -z-1  overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default AnimatedGradient;
