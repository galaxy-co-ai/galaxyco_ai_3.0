import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
      {/* Geometric background shapes */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top-left subtle shape */}
        <div 
          className="absolute -left-20 -top-20 h-96 w-96 rotate-12 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200/50 opacity-60"
          style={{ transform: "rotate(-15deg)" }}
        />
        
        {/* Top-right angled shape */}
        <div 
          className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-3xl bg-gradient-to-bl from-slate-100 to-transparent opacity-80"
          style={{ transform: "rotate(25deg)" }}
        />
        
        {/* Bottom-right purple gradient */}
        <div 
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-violet-200/40 via-violet-100/20 to-transparent opacity-70 blur-3xl"
        />
        
        {/* Bottom-left subtle shape */}
        <div 
          className="absolute -bottom-20 -left-20 h-80 w-80 rounded-3xl bg-gradient-to-tr from-slate-200/60 to-transparent opacity-50"
          style={{ transform: "rotate(15deg)" }}
        />
        
        {/* Center-right geometric accent */}
        <div 
          className="absolute right-10 top-1/3 h-64 w-64 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white/80 to-slate-100/30 opacity-60"
          style={{ transform: "rotate(12deg)" }}
        />
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Sign-in card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl",
              headerTitle: "text-slate-900 font-semibold",
              headerSubtitle: "text-slate-500",
              socialButtonsBlockButton:
                "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors",
              socialButtonsBlockButtonText: "text-slate-700 font-medium",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-400",
              formFieldLabel: "text-slate-700 font-medium",
              formFieldInput:
                "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-500 rounded-lg",
              formButtonPrimary:
                "bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors",
              footerActionLink: "text-violet-600 hover:text-violet-700 font-medium",
              identityPreviewText: "text-slate-700",
              identityPreviewEditButton: "text-violet-600",
              formFieldSuccessText: "text-emerald-600",
              formFieldErrorText: "text-red-500",
              alertText: "text-slate-600",
              logoBox: "justify-center",
              footer: "bg-slate-50/80",
              footerAction: "text-slate-600",
            },
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            },
          }}
        />
      </div>
    </main>
  );
}
