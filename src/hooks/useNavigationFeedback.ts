import { useContext } from "react"
import { NavigationFeedbackContext } from "@/contexts/NavigationFeedbackContext"

export function useNavigationFeedback() {
  const context = useContext(NavigationFeedbackContext)

  if (!context) {
    throw new Error("useNavigationFeedback must be used within NavigationFeedbackProvider")
  }

  return context
}
