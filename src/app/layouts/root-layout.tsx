import { Navbar } from '@/shared/components/ui/navbar'
import Logo from '@/assets/logo.png'
import { Outlet } from '@tanstack/react-router'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar title="Fleet" logo={Logo} />

      <main className="mx-auto w-full max-w-content flex-1 px-5 pt-7 pb-16">
        <Outlet />
      </main>
    </div>
  )
}
