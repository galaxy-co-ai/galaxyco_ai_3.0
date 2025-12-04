import { Rocket, Sparkles } from "lucide-react";
import { NotifyMeForm } from "@/components/lunar-labs/NotifyMeForm";
import { LunarLabsStars } from "./stars";

export const metadata = {
  title: "Lunar Labs | Coming Soon",
  description: "Something amazing is launching soon. Stay tuned.",
};

export default function LunarLabsPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        {/* Stars - client component for random positioning */}
        <LunarLabsStars />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Icon */}
        <div className="mb-8 inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Rocket className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">Lunar Labs</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Something{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            amazing
          </span>
          <br />
          is launching soon
        </h1>

        {/* Description */}
        <p className="text-lg text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
          We&apos;re building a completely new learning experience. 
          Interactive courses, AI-powered guidance, and hands-on projects.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NotifyMeForm />
          <p className="text-sm text-slate-500">
            Be the first to know when we launch
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 flex items-center justify-center gap-2 text-slate-600">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-slate-700" />
          <span className="text-xs uppercase tracking-wider">GalaxyCo.ai</span>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-slate-700" />
        </div>
      </div>
    </div>
  );
}
