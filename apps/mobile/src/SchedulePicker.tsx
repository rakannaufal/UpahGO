import React from "react";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Action } from "./ui";
import { scheduleIso } from "../../../shared/contracts";
type Props = {
  date: string;
  time: string;
  zone: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
};
export function SchedulePicker({ date, time, zone, onDate, onTime }: Props) {
  const open = (mode: "date" | "time") => {
    const value = date
      ? new Date(scheduleIso(date, time || "09:00", zone))
      : new Date();
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      timeZoneName: zone,
      onChange: (event, selected) => {
        if (event.type !== "set" || !selected) return;
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: zone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).formatToParts(selected);
        const get = (type: string) => parts.find((p) => p.type === type)!.value;
        if (mode === "date")
          onDate(`${get("year")}-${get("month")}-${get("day")}`);
        else onTime(`${get("hour")}:${get("minute")}`);
      },
    });
  };
  return (
    <>
      <Action secondary onPress={() => open("date")}>
        {date ? `Tanggal · ${date}` : "Pilih tanggal"}
      </Action>
      <Action secondary onPress={() => open("time")}>
        {time ? `Jam · ${time}` : "Pilih jam"}
      </Action>
    </>
  );
}
