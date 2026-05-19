import { verifySession } from '@/app/lib/dal'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirects to /login if not authenticated
  await verifySession()

  return (
    <>
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
