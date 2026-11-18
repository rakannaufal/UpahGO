import React from "react";
import { AccountGate } from "../src/ui";
import { Content } from "./onboarding";
export default function IntroPreview() {
  return (
    <AccountGate>
      <Content preview />
    </AccountGate>
  );
}
