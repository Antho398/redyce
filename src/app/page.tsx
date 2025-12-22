/**
 * Page d'accueil publique
 */

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Redyce</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Génération de mémoires techniques avec intelligence artificielle
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Se connecter
          </a>
          <a
            href="/register"
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent"
          >
            S'inscrire
          </a>
        </div>
      </main>
    </div>
  )
}

