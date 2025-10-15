// client/src/components/ui/toaster.tsx
import { Toaster } from 'sonner'

export function ToasterProvider() {
  return <Toaster richColors position="top-center" />
}

// للتوافق مع بعض الأكواد التي تستورد { Toaster } مباشرة
export { Toaster }
