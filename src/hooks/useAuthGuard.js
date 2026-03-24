import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../services/api";

export function useAuthGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authStore.getToken()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
}