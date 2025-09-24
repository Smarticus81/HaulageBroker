'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, FileText, Users, Truck, MapPin, Package, DollarSign, BarChart3, Menu, X, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Shield },
  { name: 'Loads', href: '/loadboard', icon: Truck },
  { name: 'Intake', href: '/load-intake', icon: FileText },
  { name: 'Carriers', href: '/carrier-sourcing', icon: Users },
  { name: 'Dispatch', href: '/dispatch', icon: MapPin },
  { name: 'Track', href: '/monitoring', icon: Package },
  { name: 'Deliver', href: '/delivery', icon: Package },
  { name: 'Pay', href: '/settlements', icon: DollarSign },
  { name: 'Reports', href: '/analytics', icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('broker-user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('broker-auth')
    localStorage.removeItem('broker-user')
    router.push('/login')
  }

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm sticky top-0 z-50" data-nav="single">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
            <div className="relative">
              <Shield className="h-9 w-9 text-slate-700" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-light text-slate-800 tracking-wide">Anderson Direct</span>
              <span className="text-xs text-slate-500 -mt-1 tracking-wider">TRANSPORT</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Navigation Items */}
            <div className="flex items-center space-x-1 mr-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                           className={cn(
                             'group relative flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'text-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                    )}
                  >
                    <div className="hover:scale-110 hover:rotate-3 transition-transform duration-200">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="hidden lg:block">{item.name}</span>
                    
                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/5 group-hover:to-indigo-400/5 transition-all duration-300 -z-10"></div>
                  </Link>
                </div>
              )
            })}
            </div>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl hover:bg-slate-50/80 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.role}</div>
                  </div>
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-200/50">
                      <div className="text-sm font-medium text-slate-800">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                      <div className="text-xs text-blue-600 mt-1">{user.company}</div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50/50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-2xl text-slate-600 hover:text-slate-800 hover:bg-slate-50/80 transition-all duration-300 active:scale-95"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-200" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/50 overflow-hidden transition-all duration-300">
            <div className="py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300',
                        isActive
                          ? 'text-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
