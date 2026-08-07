import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { useOrganizations } from "@/hooks/useOrganizations"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const LOGIN_BACKGROUND_SRC = "/images/bg.jpeg"

const loginSchema = z.object({
  organization_id: z.string().min(1, "Please select an organization"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginApiErrorTarget = "organization_id" | "email" | "password" | "Authorization" | string

type LoginApiErrorItem = {
  code?: string
  message?: string
  target?: LoginApiErrorTarget
  type?: string
}

type ParsedLoginError = {
  message: string
  target?: LoginApiErrorTarget
}

function parseLoginError(error: unknown): ParsedLoginError {
  if (typeof error === "object" && error !== null) {
    const errorWithResponse = error as {
      response?: {
        data?: {
          message?: string
          errors?: LoginApiErrorItem[]
        }
      }
      message?: string
    }

    const apiError = errorWithResponse.response?.data?.errors?.[0]
    if (apiError?.message) {
      return {
        message: apiError.message,
        target: apiError.target,
      }
    }

    if (errorWithResponse.response?.data?.message) {
      return {
        message: errorWithResponse.response.data.message,
      }
    }

    if (errorWithResponse.message) {
      return {
        message: errorWithResponse.message,
      }
    }
  }

  if (error instanceof Error && error.message) {
    return {
      message: error.message,
    }
  }

  return {
    message: "Login failed. Please try again.",
  }
}

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { data: organizations, isLoading: isLoadingOrgs } = useOrganizations()
  const [isBackgroundReady, setIsBackgroundReady] = useState(false)

  useEffect(() => {
    const image = new Image()
    image.src = LOGIN_BACKGROUND_SRC
    image.decoding = "async"

    if (image.complete) {
      setIsBackgroundReady(true)
      return
    }

    const handleLoad = () => setIsBackgroundReady(true)
    const handleError = () => setIsBackgroundReady(true)

    image.addEventListener("load", handleLoad)
    image.addEventListener("error", handleError)

    return () => {
      image.removeEventListener("load", handleLoad)
      image.removeEventListener("error", handleError)
    }
  }, [])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      organization_id: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    form.clearErrors()

    try {
      await login(values)
      navigate("/", { replace: true })
    } catch (error: unknown) {
      const parsedError = parseLoginError(error)

      if (
        parsedError.target === "organization_id" ||
        parsedError.target === "email" ||
        parsedError.target === "password"
      ) {
        form.setError(parsedError.target, {
          type: "server",
          message: parsedError.message,
        })
        return
      }

      form.setError("root", {
        type: "server",
        message: parsedError.message,
      })
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-slate-950" />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7))]"
      />
      <img
        src={LOGIN_BACKGROUND_SRC}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={() => setIsBackgroundReady(true)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          isBackgroundReady ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative flex min-h-screen items-center justify-center px-6 lg:px-20">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border-0 rounded-2xl">
          <CardHeader>
            <CardTitle>
              <img
                src="/images/logo.svg"
                className="h-12"
                alt="Company Logo"
                loading="eager"
                decoding="async"
              />
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Sign in
                  </h1>
                  <p className="text-sm text-slate-500">
                    Enter your organization, email address, and password to continue.
                  </p>
                </div>

                {/* Organization */}
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>

                      <Select
                        disabled={isLoadingOrgs}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={isLoadingOrgs ? "Loading organizations..." : "Select organization"} />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>

                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@company.com"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>

                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Server Error */}
                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium shadow-md"
                  disabled={form.formState.isSubmitting || isLoadingOrgs}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
