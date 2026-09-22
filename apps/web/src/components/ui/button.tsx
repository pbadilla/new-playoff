import * as React from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'
const buttonVariants = cva('inline-flex items-center justify-center gap-2 rounded-[4px] text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]',{variants:{variant:{default:'bg-primary text-primary-foreground shadow-sm hover:opacity-90',outline:'border border-border bg-background hover:bg-muted',ghost:'hover:bg-muted',secondary:'bg-secondary text-secondary-foreground hover:opacity-90'},size:{default:'h-10 px-4',sm:'h-9 px-3',icon:'size-10'}},defaultVariants:{variant:'default',size:'default'}})
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants>{}
export function Button({className,variant,size,...props}:ButtonProps){return <button
className={cn(buttonVariants({variant,size}),className)}
{...props}
/>}
