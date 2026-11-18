import React, { useState } from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import Svg, { Path } from "react-native-svg";
import {
  Action,
  Field,
  LoadState,
  Note,
  Panel,
  Sheet,
  s,
  useLoad,
  useTask,
} from "./ui";
import { useSession } from "./session";
import { c, tokens } from "./theme";
import type { Agreement } from "../../../shared/contracts";
import { validateReview } from "../../../shared/geo";
export function Star({ filled = true }: { filled?: boolean }) {
  return (
    <Svg
      width={tokens.size.icon}
      height={tokens.size.icon}
      viewBox="0 0 24 24"
      aria-hidden
      pointerEvents="none"
    >
      <Path
        d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z"
        fill={filled ? c.ratingStar : "none"}
        stroke={c.ratingStarOutline}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function RatingSummary({
  average,
  count,
  compact = false,
}: {
  average: number | null;
  count: number;
  compact?: boolean;
}) {
  const hasRating = count > 0 && average !== null;
  return (
    <View
      testID="rating-summary"
      accessibilityLabel={
        hasRating
          ? `${average?.toFixed(1)} dari 5, ${count} ulasan`
          : "Belum ada ulasan"
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        flexWrap: "wrap",
      }}
    >
      <Star filled={hasRating} />
      <Text
        style={[
          s.small,
          { color: c.onSurface },
          compact && { fontSize: 13, lineHeight: 20 },
        ]}
      >
        {hasRating
          ? `${average.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${count})`
          : "Belum dinilai"}
      </Text>
    </View>
  );
}
export function ProfileReviews({ id, role }: { id: string; role: string }) {
  const { api } = useSession();
  const load = useLoad(
    () => api.call("reviews", { id, role }),
    [api, id, role],
  );
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.section}>Ulasan pekerjaan</Text>
      <LoadState {...load} />
      {load.value?.length === 0 && (
        <Text style={s.small}>Belum ada ulasan.</Text>
      )}
      {load.value?.map((r) => (
        <View
          key={r.id}
          style={{
            gap: 8,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderColor: c.outlineVariant,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[s.body, { flex: 1, fontWeight: "700" }]}>
              {r.reviewerName}
            </Text>
            <Star />
            <Text style={s.body}>{r.score}/5</Text>
          </View>
          {!!r.comment && <Text style={s.body}>{r.comment}</Text>}
          <Text style={s.small}>
            {new Date(r.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      ))}
    </View>
  );
}
export function AgreementRating({ agreement }: { agreement: Agreement }) {
  const state = useSession();
  const task = useTask();
  const load = useLoad(
    () => state.api.call("agreement_reviews", { id: agreement.id }),
    [state.api, agreement.id],
  );
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const target =
    state.data!.account.id === agreement.workerId ? "penyedia kerja" : "buruh";
  return (
    <>
      <LoadState {...load} />
      {load.value &&
        (load.value.submitted ? (
          <Panel>
            <Text style={s.section}>Penilaianmu</Text>
            <RatingSummary average={load.value.submitted.score} count={1} />
            {!!load.value.submitted.comment && (
              <Text style={s.body}>{load.value.submitted.comment}</Text>
            )}
          </Panel>
        ) : (
          <Action
            secondary
            onPress={() => setOpen(true)}
          >{`Nilai ${target}`}</Action>
        ))}
      {!!load.value?.received && (
        <Panel>
          <Text style={s.section}>Penilaian untukmu</Text>
          <RatingSummary average={load.value.received.score} count={1} />
          {!!load.value.received.comment && (
            <Text style={s.body}>{load.value.received.comment}</Text>
          )}
        </Panel>
      )}
      <Sheet
        visible={open}
        title={`Nilai ${target}`}
        onClose={() => {
          if (!task.busy) setOpen(false);
        }}
      >
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Jumlah bintang"
          style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableRipple
              key={n}
              accessibilityRole="radio"
              accessibilityLabel={`${n} bintang`}
              accessibilityState={{ checked: score === n }}
              aria-checked={score === n}
              disabled={task.busy}
              onPress={() => setScore(n)}
              style={{
                borderRadius: 10,
                backgroundColor: score === n ? c.primaryContainer : c.surface,
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Star filled={n <= score} />
              </View>
            </TouchableRipple>
          ))}
        </View>
        <Field
          label="Ulasan (opsional)"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={300}
          editable={!task.busy}
        />
        <Text style={s.small}>
          Terlihat di profil setelah dikirim. Tanpa nomor, tautan, atau alamat
          pribadi.
        </Text>
        <Action
          disabled={!score}
          busy={task.busy}
          onPress={() =>
            void task.run(async () => {
              validateReview(score, comment.trim());
              await state.api.call("submit_review", {
                id: agreement.id,
                score,
                comment: comment.trim(),
              });
              setOpen(false);
              load.reload();
            })
          }
        >
          Kirim penilaian
        </Action>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
    </>
  );
}
