/**
 * Page de connexion - Style compact et professionnel
 * Design cohérent avec le dashboard
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

type BackgroundStyle = 'geometric' | 'gradient' | 'grid' | 'abstract' | 'glow' | 'mixed'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('geometric')
  const parallaxRef = useRef<HTMLDivElement>(null)

  // Effet de parallaxe pour certains fonds
  useEffect(() => {
    if (bgStyle !== 'geometric' && bgStyle !== 'abstract' && bgStyle !== 'mixed') return

    const handleMouseMove = (e: MouseEvent) => {
      if (!parallaxRef.current) return

      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      const xPercent = clientX / innerWidth
      const yPercent = clientY / innerHeight

      const moveX = (xPercent - 0.5) * 8
      const moveY = (yPercent - 0.5) * 8

      parallaxRef.current.style.transform = `translate(${moveX}%, ${moveY}%) scale(1.02)`
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [bgStyle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou mot de passe incorrect")
      } else if (result?.ok) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  // Rendu du fond selon le style choisi
  const renderBackground = () => {
    switch (bgStyle) {
      case 'geometric':
        return (
          <div ref={parallaxRef} className="absolute inset-0 w-[120%] h-[120%]" style={{ left: "-10%", top: "-10%" }}>
            {/* Fond de base */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200" />

            {/* Formes géométriques flottantes */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8D347" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F8D347" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Cercles */}
              <circle cx="10%" cy="20%" r="150" fill="url(#grad1)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="85%" cy="15%" r="100" fill="url(#grad2)" className="animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
              <circle cx="75%" cy="80%" r="180" fill="url(#grad1)" className="animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
              <circle cx="20%" cy="75%" r="120" fill="url(#grad2)" className="animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }} />

              {/* Rectangles arrondis */}
              <rect x="50%" y="10%" width="200" height="200" rx="40" fill="url(#grad1)" transform="rotate(15)" opacity="0.5" />
              <rect x="5%" y="50%" width="150" height="150" rx="30" fill="url(#grad2)" transform="rotate(-10)" opacity="0.4" />

              {/* Lignes décoratives */}
              <line x1="0" y1="30%" x2="100%" y2="35%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.1" />
              <line x1="0" y1="70%" x2="100%" y2="65%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.1" />
            </svg>
          </div>
        )

      case 'gradient':
        return (
          <div className="absolute inset-0">
            {/* Gradient animé */}
            <div
              className="absolute inset-0 animate-gradient-shift"
              style={{
                background: 'linear-gradient(-45deg, hsl(var(--primary)), #667eea, #764ba2, #F8D347, hsl(var(--primary)))',
                backgroundSize: '400% 400%',
                animation: 'gradientShift 15s ease infinite',
              }}
            />
            {/* Overlay pour adoucir */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />

            <style jsx>{`
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
          </div>
        )

      case 'grid':
        return (
          <div className="absolute inset-0 bg-slate-50">
            {/* Grille de points */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.3,
              }}
            />
            {/* Lignes de perspective */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[...Array(20)].map((_, i) => (
                <line
                  key={i}
                  x1={`${i * 5}%`}
                  y1="0"
                  x2="50%"
                  y2="100%"
                  stroke="url(#fadeGrad)"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
        )

      case 'abstract':
        return (
          <div ref={parallaxRef} className="absolute inset-0 w-[120%] h-[120%]" style={{ left: "-10%", top: "-10%" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />

            {/* Formes abstraites représentant des documents/flux */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8D347" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F8D347" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Documents stylisés */}
              <g transform="translate(100, 150) rotate(-15)">
                <rect width="180" height="220" rx="8" fill="url(#docGrad)" />
                <rect x="20" y="30" width="100" height="8" rx="4" fill="hsl(var(--primary))" opacity="0.2" />
                <rect x="20" y="50" width="140" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.15" />
                <rect x="20" y="65" width="120" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.15" />
                <rect x="20" y="80" width="130" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.15" />
              </g>

              <g transform="translate(750, 100) rotate(10)">
                <rect width="160" height="200" rx="8" fill="url(#accentGrad)" />
                <rect x="18" y="25" width="90" height="8" rx="4" fill="#F8D347" opacity="0.3" />
                <rect x="18" y="45" width="120" height="6" rx="3" fill="#F8D347" opacity="0.2" />
                <rect x="18" y="60" width="100" height="6" rx="3" fill="#F8D347" opacity="0.2" />
              </g>

              <g transform="translate(200, 650) rotate(5)">
                <rect width="200" height="240" rx="10" fill="url(#docGrad)" />
                <rect x="25" y="35" width="110" height="10" rx="5" fill="hsl(var(--primary))" opacity="0.2" />
                <rect x="25" y="55" width="150" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.15" />
                <rect x="25" y="70" width="130" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.15" />
              </g>

              <g transform="translate(700, 600) rotate(-8)">
                <rect width="170" height="210" rx="8" fill="url(#accentGrad)" />
              </g>

              {/* Lignes de connexion (flux) */}
              <path d="M280 270 Q 400 350 600 200" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.15" strokeDasharray="8,4" />
              <path d="M400 750 Q 500 500 750 650" stroke="#F8D347" strokeWidth="2" fill="none" opacity="0.2" strokeDasharray="8,4" />
            </svg>
          </div>
        )

      case 'glow':
        return (
          <div className="absolute inset-0 bg-slate-50">
            {/* Halo lumineux central */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 40%, transparent 70%)',
              }}
            />
            {/* Halo secondaire accent */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(248, 211, 71, 0.1) 0%, rgba(248, 211, 71, 0.02) 50%, transparent 70%)',
              }}
            />
            {/* Subtil pattern de fond */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )

      case 'mixed':
        return (
          <div className="absolute inset-0">
            {/* Gradient animé en fond */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(-45deg, hsl(var(--primary)), #667eea, #764ba2, #F8D347, hsl(var(--primary)))',
                backgroundSize: '400% 400%',
                animation: 'gradientShift 15s ease infinite',
              }}
            />

            {/* Overlay léger pour adoucir */}
            <div className="absolute inset-0 bg-white/20" />

            {/* Documents abstraits avec parallaxe */}
            <div ref={parallaxRef} className="absolute inset-0 w-[120%] h-[120%]" style={{ left: "-10%", top: "-10%" }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="mixDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="mixAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Documents stylisés */}
                {/* Doc haut-gauche */}
                <g transform="translate(100, 150) rotate(-15)">
                  <rect width="180" height="220" rx="8" fill="url(#mixDocGrad)" />
                  <rect x="20" y="30" width="100" height="8" rx="4" fill="white" opacity="0.3" />
                  <rect x="20" y="50" width="140" height="6" rx="3" fill="white" opacity="0.2" />
                  <rect x="20" y="65" width="120" height="6" rx="3" fill="white" opacity="0.2" />
                  <rect x="20" y="80" width="130" height="6" rx="3" fill="white" opacity="0.2" />
                </g>

                {/* Doc haut-droite */}
                <g transform="translate(750, 100) rotate(10)">
                  <rect width="160" height="200" rx="8" fill="url(#mixAccentGrad)" />
                  <rect x="18" y="25" width="90" height="8" rx="4" fill="white" opacity="0.35" />
                  <rect x="18" y="45" width="120" height="6" rx="3" fill="white" opacity="0.25" />
                  <rect x="18" y="60" width="100" height="6" rx="3" fill="white" opacity="0.25" />
                </g>

                {/* Doc bas-gauche */}
                <g transform="translate(200, 650) rotate(5)">
                  <rect width="200" height="240" rx="10" fill="url(#mixDocGrad)" />
                  <rect x="25" y="35" width="110" height="10" rx="5" fill="white" opacity="0.3" />
                  <rect x="25" y="55" width="150" height="6" rx="3" fill="white" opacity="0.2" />
                  <rect x="25" y="70" width="130" height="6" rx="3" fill="white" opacity="0.2" />
                </g>

                {/* Doc bas-droite */}
                <g transform="translate(700, 600) rotate(-8)">
                  <rect width="170" height="210" rx="8" fill="url(#mixAccentGrad)" />
                  <rect x="20" y="28" width="95" height="8" rx="4" fill="white" opacity="0.3" />
                  <rect x="20" y="46" width="130" height="6" rx="3" fill="white" opacity="0.22" />
                  <rect x="20" y="60" width="110" height="6" rx="3" fill="white" opacity="0.22" />
                </g>

                {/* Lignes de connexion (flux) */}
                <path d="M280 270 Q 400 350 600 200" stroke="white" strokeWidth="2" fill="none" opacity="0.18" strokeDasharray="8,4" />
                <path d="M400 750 Q 500 500 750 650" stroke="white" strokeWidth="2" fill="none" opacity="0.2" strokeDasharray="8,4" />
              </svg>
            </div>

            <style jsx>{`
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
          </div>
        )
    }
  }

  const bgLabels: Record<BackgroundStyle, string> = {
    geometric: '1. Géométrique',
    gradient: '2. Gradient animé',
    grid: '3. Grille/Points',
    abstract: '4. Documents abstraits',
    glow: '5. Glow épuré',
    mixed: '6. Mix (Gradient + Docs)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-background">
      {/* Fond dynamique */}
      {renderBackground()}

      {/* Sélecteur de style (temporaire pour test) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
        <span className="text-xs font-medium text-muted-foreground mb-1">Style de fond :</span>
        {(Object.keys(bgLabels) as BackgroundStyle[]).map((style) => (
          <button
            key={style}
            onClick={() => setBgStyle(style)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all text-left ${
              bgStyle === style
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-100 hover:bg-slate-200 text-foreground'
            }`}
          >
            {bgLabels[style]}
          </button>
        ))}
      </div>

      {/* Contenu au-dessus */}
      <Card className="w-full max-w-md rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm shadow-xl relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3">
            <div className="flex items-center justify-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 16C8 13.7909 9.79086 12 12 12H20C22.2091 12 24 13.7909 24 16C24 18.2091 22.2091 20 20 20H12C9.79086 20 8 18.2091 8 16Z" fill="currentColor" className="text-primary-foreground"/>
                  <path d="M12 14C10.8954 14 10 14.8954 10 16C10 17.1046 10.8954 18 12 18H20C21.1046 18 22 17.1046 22 16C22 14.8954 21.1046 14 20 14H12Z" fill="currentColor" className="text-primary"/>
                  <circle cx="14" cy="16" r="1.5" fill="currentColor" className="text-primary-foreground"/>
                  <circle cx="18" cy="16" r="1.5" fill="currentColor" className="text-primary-foreground"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Redyce</h1>
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">Connexion</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1.5">
            Connectez-vous à votre compte pour accéder à vos projets
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-xl text-sm px-4 py-2 h-9" 
              variant="default" 
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <a href="/register" className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
              Créer un compte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
