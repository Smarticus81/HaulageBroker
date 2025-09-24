'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, EyeOff, Truck, BarChart3, Users, DollarSign } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate authentication
    setTimeout(() => {
      localStorage.setItem('broker-auth', 'authenticated')
      localStorage.setItem('broker-user', JSON.stringify({
        name: 'Devin Anderson',
        email: email,
        role: 'President',
        company: 'Anderson Direct Transport'
      }))
      router.push('/dashboard')
    }, 1500)
  }

  const demoLogin = () => {
    setEmail('devin@andersondirect.com')
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-9 w-9 text-slate-700" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-light text-slate-800 tracking-wide">Anderson Direct</span>
              <span className="text-xs text-slate-500 -mt-1 tracking-wider">TRANSPORT BROKER PORTAL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Login Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-4xl font-light text-slate-800 mb-4 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-slate-600 text-lg">
                Access your freight brokerage operations dashboard
              </p>
            </div>

            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-light text-slate-800">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access the broker console</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                        placeholder="devin@andersondirect.com"
                      className="h-12 rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-12 rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl text-white font-medium shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      'Sign In to Console'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={demoLogin}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      Use Demo Credentials
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Features */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-light text-slate-800 mb-4">
                Complete Brokerage Management
              </h2>
              <p className="text-slate-600 text-lg">
                Streamline your freight operations with our comprehensive broker console
              </p>
            </div>

            <div className="grid gap-6">
              {[
                {
                  icon: Truck,
                  title: "Load Management",
                  description: "Track loads from quote to delivery with real-time updates"
                },
                {
                  icon: Users,
                  title: "Carrier Network",
                  description: "Manage relationships with trusted carriers and drivers"
                },
                {
                  icon: DollarSign,
                  title: "Financial Operations",
                  description: "Handle settlements, invoicing, and payment processing"
                },
                {
                  icon: BarChart3,
                  title: "Business Analytics",
                  description: "Gain insights with comprehensive reporting and metrics"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-6 bg-white/40 backdrop-blur-sm rounded-3xl border border-slate-200/50">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
