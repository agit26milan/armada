import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface DarkModeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const getSystemMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyMode = (mode: ThemeMode): void => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
}

export const useDarkModeStore = create<DarkModeState>()(
  persist(
    (set, get) => ({
      mode: getSystemMode(),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'trans:theme',
      version: 1,
      onRehydrateStorage: () => (state) => {
        applyMode(state?.mode ?? getSystemMode())
      },
    },
  ),
)

applyMode(useDarkModeStore.getState().mode)

useDarkModeStore.subscribe((state, previousState) => {
  if (state.mode !== previousState.mode) {
    applyMode(state.mode)
  }
})

export function useDarkMode() {
  const mode = useDarkModeStore((state) => state.mode)
  const setMode = useDarkModeStore((state) => state.setMode)
  const toggleMode = useDarkModeStore((state) => state.toggleMode)

  return { mode, isDark: mode === 'dark', setMode, toggleMode }
}
