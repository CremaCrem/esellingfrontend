import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface LogoutModalContextType {
  showLogoutModal: boolean;
  setShowLogoutModal: (show: boolean) => void;
  handleLogout: () => void;
  setHandleLogout: (handler: () => void) => void;
}

const LogoutModalContext = createContext<LogoutModalContextType | undefined>(
  undefined
);

export const useLogoutModal = () => {
  const context = useContext(LogoutModalContext);
  if (!context) {
    throw new Error("useLogoutModal must be used within a LogoutModalProvider");
  }
  return context;
};

interface LogoutModalProviderProps {
  children: ReactNode;
}

export const LogoutModalProvider: React.FC<LogoutModalProviderProps> = ({
  children,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [handleLogout, setHandleLogout] = useState<() => void>(() => {});

  return (
    <LogoutModalContext.Provider
      value={{
        showLogoutModal,
        setShowLogoutModal,
        handleLogout,
        setHandleLogout,
      }}
    >
      {children}
    </LogoutModalContext.Provider>
  );
};
