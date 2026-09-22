import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '../../lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { children: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <DialogPrimitive.Content
className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[4px] border border-border bg-card p-5 text-card-foreground shadow-2xl outline-none', className)}
{...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-[4px] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
<X size={17} />
<span className="sr-only">
Cerrar
</span>
</DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ title, description }: { title: string; description?: string }) {
  return <div className="mb-5 pr-8">
<DialogPrimitive.Title className="font-semibold">
{title}
</DialogPrimitive.Title>
{description && <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">
{description}
</DialogPrimitive.Description>}
</div>
}
