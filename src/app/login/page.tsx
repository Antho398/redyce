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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const parallaxRef = useRef<HTMLDivElement>(null)

  // Effet de parallaxe
  useEffect(() => {
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
  }, [])

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

  // Fond Mix (Gradient + Documents)
  const renderBackground = () => (
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-background">
      {/* Fond animé */}
      {renderBackground()}

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
