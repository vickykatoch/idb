import { type PropsWithChildren } from 'react'

export type ApplicationProviderProps = PropsWithChildren<{
  appName?: string
}>

export function ApplicationProvider({
  appName = 'IDB Application',
  children,
}: ApplicationProviderProps) {
  return (
    <div data-app-name={appName} data-provider="application-provider">
      {children}
    </div>
  )
}
