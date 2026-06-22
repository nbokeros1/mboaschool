import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'icon'
}

export function Button({ className = '', variant = 'default', size = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold transition disabled:opacity-50'
  const variants = {
    default: 'bg-emerald-700 text-white hover:bg-emerald-800',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50',
    ghost: 'hover:bg-slate-100'
  }
  const sizes = { default: 'px-4 py-2', icon: 'w-10 h-10' }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-white border border-slate-100 shadow-sm ${className}`} {...props} />
}
