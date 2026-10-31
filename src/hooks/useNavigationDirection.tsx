import { createContext, useContext, useRef, useCallback, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Direction = "forward" | "back";

interface NavigationDirectionContextType {
  direction: Direction;
  navigateForward: (to: string) => void;
  navigateBack: () => void;
}

const NavigationDirectionContext = createContext<NavigationDirectionContextType>({
  direction: "forward",
  navigateForward: () => {},
  navigateBack: () => {},
});

export function NavigationDirectionProvider({ children }: { children: ReactNode }) {
  const directionRef = useRef<Direction>("forward");
  const navigate = useNavigate();

  const navigateForward = useCallback((to: string) => {
    directionRef.current = "forward";
    navigate(to);
  }, [navigate]);

  const navigateBack = useCallback(() => {
    directionRef.current = "back";
    navigate(-1);
  }, [navigate]);

  return (
    <NavigationDirectionContext.Provider
      value={{
        direction: directionRef.current,
        navigateForward,
        navigateBack,
      }}
    >
      {children}
    </NavigationDirectionContext.Provider>
  );
}

export function useNavigationDirection() {
  return useContext(NavigationDirectionContext);
}
