/**
 * Page d'inscription - Style compact et professionnel
 * Design cohérent avec le dashboard
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })

      const data = await res.json()

      if (data.success) {
        router.push("/login?registered=true")
      } else {
        setError(data.error?.message || "Erreur lors de l'inscription")
      }
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md rounded-xl border border-border/50 bg-card shadow-sm">
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
          <CardTitle className="text-2xl font-semibold text-foreground">Créer un compte</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1.5">
            Inscrivez-vous pour commencer à générer des mémoires techniques avec l&apos;IA
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
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Nom (optionnel)
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="text-sm"
              />
            </div>

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
                  placeholder="Au moins 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <a href="/login" className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
              Se connecter
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
