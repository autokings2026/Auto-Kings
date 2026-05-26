import { redirect } from 'next/navigation'

// La raíz redirige al dashboard (el middleware maneja la auth)
export default function RootPage() {
  redirect('/dashboard')
}
