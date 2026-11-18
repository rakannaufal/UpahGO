import React, { useState } from "react";
import { usePreventRemove } from "expo-router";
import { Action, Sheet } from "./ui";
export function useDraftGuard(dirty: boolean) {
  const [repeat, setRepeat] = useState<null | (() => void)>(null);
  const [allowed, setAllowed] = useState(false);
  const disable = usePreventRemove(dirty && !allowed, ({ repeat }) =>
    setRepeat(() => repeat),
  );
  const proceed = (action: () => void) => {
    setAllowed(true);
    disable();
    action();
  };
  const prompt = (
    <Sheet
      visible={!!repeat}
      title="Buang perubahan?"
      onClose={() => setRepeat(null)}
    >
      <Action
        onPress={() => {
          if (repeat) proceed(repeat);
          setRepeat(null);
        }}
      >
        Buang perubahan
      </Action>
      <Action secondary onPress={() => setRepeat(null)}>
        Lanjut mengisi
      </Action>
    </Sheet>
  );
  const confirm = (action: () => void) => {
    if (dirty && !allowed) setRepeat(() => action);
    else action();
  };
  return { prompt, proceed, confirm };
}
