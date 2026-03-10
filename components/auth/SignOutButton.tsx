'use client';

import { Button, type ButtonProps } from "@/components/ui/Button";
import { signOutAction } from "@/app/auth/actions";

type SignOutButtonProps = Omit<ButtonProps, "type"> & {
  redirectTo?: string;
};

export const SignOutButton = ({
  redirectTo,
  children = "Sign out",
  ...buttonProps
}: SignOutButtonProps) => {
  const submitAction = signOutAction.bind(null, redirectTo);

  return (
    <form action={submitAction}>
      <Button {...buttonProps}>{children}</Button>
    </form>
  );
};
