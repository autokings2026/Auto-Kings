import { auth } from '@/auth'
import { Car, CalendarDays, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LABEL_ROL, FaseOT, LABEL_FASE, RolUsuario } from '@kings/shared'
import Link from 'next/link'
import { getDashboardStats } from '@/lib/services/ordenes'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Dashboard | Kings Auto' }

const FASE_COLOR: Partial<Record<FaseOT, string>> = {
  [FaseOT.LLEGADA_FOTOS]:   'bg-cyan-500/20 text-cyan-300',
  [FaseOT.DIAGNOSTICO]:     'bg-blue-500/20 text-blue-300',
  [FaseOT.REPARACION]:      'bg-amber-500/20 text-amber-300',
  [FaseOT.CONTROL_CALIDAD]: 'bg-purple-500/20 text-purple-300',
  [FaseOT.ENTREGA]:         'bg-green-500/20 text-green-300',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null
  const { nombre, rol } = session.user

  const stats = await getDashboardStats({ userId: session.user.id, rol: session.user.rol }).catch(() => null)

  const cards = [
    {
      label: 'Citas esta semana',
      value: stats?.citasHoy ?? '—',
      icon: CalendarDays,
      color: 'text-secondary',
      href: '/citas',
    },
    {
      label: 'OTs activas',
      value: stats?.totalActivas ?? '—',
      icon: Car,
      color: 'text-accent',
      href: '/ordenes',
    },
    {
      label: 'Esperando aprobación',
      value: stats?.enEsperaAprobacion ?? '—',
      icon: Clock,
      color: 'text-yellow-400',
      href: '/ordenes?estado=EN_ESPERA_APROBACION',
    },
    {
      label: 'Completadas hoy',
      value: stats?.completadasHoy ?? '—',
      icon: CheckCircle2,
      color: 'text-green-400',
      href: '/ordenes?estado=COMPLETADA',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bienvenido, {nombre}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {LABEL_ROL[rol]} ·{' '}
          {new Date().toLocaleDateString('es-HN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="bg-surface border-surface-2 hover:border-secondary/40 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 pt-5 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 shrink-0">
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-white">{c.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* KPI comisión del mes */}
      {stats?.comisionMes !== null && stats?.comisionMes !== undefined && (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="flex items-center gap-4 pt-5 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.comisionMes)}</p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.rol === RolUsuario.ADMIN
                  ? `Comisiones pagadas este mes (${stats.comisionPct}%)`
                  : `Mi comisión este mes (${stats.comisionPct}% mano de obra)`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución por fase */}
      {stats && Object.keys(stats.porFase).length > 0 && (
        <Card className="bg-surface border-surface-2">
          <CardContent className="pt-5 pb-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              OTs activas por fase
            </h2>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(stats.porFase) as [FaseOT, number][]).map(([fase, count]) => (
                <Link
                  key={fase}
                  href={`/ordenes?fase=${fase}`}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 ${FASE_COLOR[fase] ?? 'bg-surface-2 text-white'}`}
                >
                  <span>{LABEL_FASE[fase]}</span>
                  <span className="font-bold">{count}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accesos rápidos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/citas">
          <Card className="bg-surface border-surface-2 hover:border-secondary/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-5 pb-5">
              <CalendarDays className="h-8 w-8 text-secondary shrink-0" />
              <div>
                <p className="font-semibold text-white">Ver citas</p>
                <p className="text-xs text-muted-foreground">Gestiona y convierte a OT</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ordenes">
          <Card className="bg-surface border-surface-2 hover:border-secondary/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-5 pb-5">
              <Car className="h-8 w-8 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-white">Órdenes de trabajo</p>
                <p className="text-xs text-muted-foreground">Seguimiento de todas las fases</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
