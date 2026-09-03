import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const LOGIN_BACKGROUND_SRC = "/images/bg.jpeg"

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email address or username"),
  password: z.string().min(1, "Enter your password"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function parseLoginError(error: unknown): string {
  const response = (error as { response?: { status?: number } } | undefined)?.response
  if (response?.status === 401 || response?.status === 403) {
    return "Invalid email/username or password."
  }
  return "We could not sign you in. Please try again."
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [isBackgroundReady, setIsBackgroundReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const image = new Image()
    image.src = LOGIN_BACKGROUND_SRC
    image.decoding = "async"
    const finishLoading = () => setIsBackgroundReady(true)
    image.addEventListener("load", finishLoading)
    image.addEventListener("error", finishLoading)
    if (image.complete) finishLoading()
    return () => {
      image.removeEventListener("load", finishLoading)
      image.removeEventListener("error", finishLoading)
    }
  }, [])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  })

  const onSubmit = async (values: LoginFormValues) => {
    form.clearErrors()
    try {
      const selection = await login(values)
      const returnTo = (location.state as { from?: { pathname?: string; search?: string } } | null)
        ?.from
      const requestedDestination = returnTo?.pathname
        ? `${returnTo.pathname}${returnTo.search || ""}`
        : "/"
      const destination = /^\/(?!\/)/.test(requestedDestination) ? requestedDestination : "/"
      navigate(selection ? "/select-workspace" : destination, {
        replace: true,
        state: selection ? { destination } : undefined,
      })
    } catch (error) {
      form.setError("root", { type: "server", message: parseLoginError(error) })
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      <img
        src={LOGIN_BACKGROUND_SRC}
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isBackgroundReady ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="absolute inset-0 bg-slate-950/60" />

      <main className="relative flex min-h-screen items-center justify-center p-5 sm:p-8">
        <Card className="w-full max-w-md rounded-lg border border-white/25 bg-white shadow-2xl">
          <CardHeader className="space-y-6 pb-2">
            <CardTitle>
              <img
                src="/images/logo.svg"
                className="h-12 max-w-full"
                alt="Vikramaditya Metrology Center"
              />
            </CardTitle>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-950">Sign in</h1>
              <p className="text-sm text-slate-600">
                Enter your email address or username and password to continue.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address or username</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="username"
                          placeholder="name@company.com"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter password"
                            className="h-11 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 size-9 text-muted-foreground"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
