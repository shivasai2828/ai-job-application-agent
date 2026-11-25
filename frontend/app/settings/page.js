"use client";

import { useState } from "react";
import { Info, RotateCcw, Save } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";

const CARD = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

const FIELDS = [
  "yourName",
  "phone",
  "linkedin",
  "github",
  "portfolio",
  "followUp1AfterDays",
  "followUp2AfterDays",
  "dailySendLimit",
];

const toFormValues = (s = {}) =>
  Object.fromEntries(FIELDS.map((f) => [f, s[f] === undefined || s[f] === null ? "" : String(s[f])]));

const isWholeNumber = (v, min) => /^\d+$/.test(String(v).trim()) && Number(v) >= min;

export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useSettings();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Your details for the email templates, plus follow-up timing and limits" />

      {isError ? (
        <ErrorState title="Couldn't load settings" message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <SettingsForm settings={data} />
      )}
    </div>
  );
}

function SettingsForm({ settings }) {
  const update = useUpdateSettings();
  const saved = toFormValues(settings);

  const [values, setValues] = useState(saved);
  const [errors, setErrors] = useState({});

  const dirty = FIELDS.some((f) => values[f] !== saved[f]);

  const setField = (field) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();

    const errs = {};
    if (!isWholeNumber(values.followUp1AfterDays, 1)) errs.followUp1AfterDays = "Enter a whole number, 1 or more";
    if (!isWholeNumber(values.followUp2AfterDays, 1)) errs.followUp2AfterDays = "Enter a whole number, 1 or more";
    else if (
      !errs.followUp1AfterDays &&
      Number(values.followUp2AfterDays) <= Number(values.followUp1AfterDays)
    ) {
      errs.followUp2AfterDays = "Must be later than follow-up 1";
    }
    if (!isWholeNumber(values.dailySendLimit, 1)) errs.dailySendLimit = "Enter a whole number, 1 or more";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    update.mutate({
      yourName: values.yourName.trim(),
      phone: values.phone.trim(),
      linkedin: values.linkedin.trim(),
      github: values.github.trim(),
      portfolio: values.portfolio.trim(),
      followUp1AfterDays: Number(values.followUp1AfterDays),
      followUp2AfterDays: Number(values.followUp2AfterDays),
      dailySendLimit: Number(values.dailySendLimit),
    });
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-6">
      <section className={CARD}>
        <h2 className="text-sm font-semibold text-gray-900">Your details</h2>
        <p className="mb-4 mt-0.5 text-xs text-gray-500">Filled into your templates wherever you use the variables below.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Your name"
            value={values.yourName}
            onChange={setField("yourName")}
            hint="{{your_name}}"
            placeholder="Shiva"
          />
          <Input
            label="Phone"
            type="tel"
            value={values.phone}
            onChange={setField("phone")}
            hint="{{phone}}"
            placeholder="+91 98765 43210"
          />
          <Input
            label="LinkedIn"
            value={values.linkedin}
            onChange={setField("linkedin")}
            hint="{{linkedin}}"
            placeholder="https://linkedin.com/in/you"
          />
          <Input
            label="GitHub"
            value={values.github}
            onChange={setField("github")}
            hint="{{github}}"
            placeholder="https://github.com/you"
          />
          <Input
            label="Portfolio"
            value={values.portfolio}
            onChange={setField("portfolio")}
            hint="{{portfolio}}"
            placeholder="https://your-portfolio.com"
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className={CARD}>
        <h2 className="text-sm font-semibold text-gray-900">Automation</h2>
        <p className="mb-4 mt-0.5 text-xs text-gray-500">Days are counted from the day the application email was sent.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Follow-up 1 after (days)"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.followUp1AfterDays}
            onChange={setField("followUp1AfterDays")}
            error={errors.followUp1AfterDays}
          />
          <Input
            label="Follow-up 2 after (days)"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.followUp2AfterDays}
            onChange={setField("followUp2AfterDays")}
            error={errors.followUp2AfterDays}
          />
          <Input
            label="Daily send limit"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.dailySendLimit}
            onChange={setField("dailySendLimit")}
            error={errors.dailySendLimit}
            hint="Keep it modest to protect your Gmail"
          />
        </div>

        <div className="mt-5 flex gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Follow-ups are sent Mon&ndash;Fri, 9 AM&ndash;6 PM IST, and only while the backend is running. If it&apos;s
            off at the scheduled time, they go out the next time it&apos;s running inside that window.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-600">{dirty ? "You have unsaved changes" : ""}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="ghost"
            icon={RotateCcw}
            disabled={!dirty || update.isPending}
            onClick={() => {
              setValues(saved);
              setErrors({});
            }}
          >
            Reset
          </Button>
          <Button type="submit" icon={Save} disabled={!dirty} loading={update.isPending}>
            Save settings
          </Button>
        </div>
      </div>
    </form>
  );
}
