import React from "react";
import { useAuth } from "@/context/AuthContext";
import { UserLoginModal } from "@/components/auth/UserLoginModal";

export const GlobalLoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginWithPhone } = useAuth();

  return (
    <UserLoginModal
      isOpen={isLoginModalOpen}
      onClose={closeLoginModal}
      onSuccess={(phone) => loginWithPhone(phone)}
    />
  );
};
