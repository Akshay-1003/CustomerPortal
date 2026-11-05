import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/services/notification.service";
import { lifecycleEventOptions, type ReminderPreferences as Preferences } from "@/types/notifications";
import { useAuth } from "@/hooks/useAuth";
import { canEditCustomerModule } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function ReminderPreferences() {
  const { user } = useAuth();
  const isAdmin = user?.user.role === "org_admin" && canEditCustomerModule(user?.user, "customer_notifications", user?.roles);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["customer-reminder-preferences", user?.user.organization_id],
    queryFn: () => notificationService.getPreferences(), enabled: isAdmin });
  const [edits, setEdits] = useState<Record<string, Preferences>>({});
  const drafts = (query.data ?? []).map(p => edits[p.laboratory_id]?.organization_id === user?.user.organization_id ? edits[p.laboratory_id] : p);
  const mutation = useMutation({ mutationFn: (p: Preferences) => notificationService.savePreferences(p),
    onSuccess: (saved) => { client.setQueryData<Preferences[]>(["customer-reminder-preferences", user?.user.organization_id], current =>
      current?.map(p => p.laboratory_id === saved.laboratory_id ? saved : p));
      setEdits(current => { const next = { ...current }; delete next[saved.laboratory_id]; return next; });
      toast.success("Reminder preferences saved"); },
    onError: () => toast.error("Unable to save reminder preferences") });
  if (!isAdmin) return null;
  const update = (id: string, patch: Partial<Preferences>) => {
    const base = drafts.find(p => p.laboratory_id === id);
    if (base) setEdits(current => ({ ...current, [id]: { ...base, ...patch } }));
  };
  return <section className="space-y-4">
    <h3 className="text-xl font-semibold">Calibration reminder preferences</h3>
    {query.isLoading && <p>Loading preferences...</p>}{query.isError && <p role="alert">Unable to load preferences.</p>}
    {drafts.map(p => <Card key={p.laboratory_id}><CardHeader><CardTitle className="text-base">{p.laboratory_name || "Laboratory reminder settings"}</CardTitle></CardHeader>
      <CardContent><form className="space-y-4" onSubmit={e => { e.preventDefault(); mutation.mutate(p); }}>
        <div className="grid gap-3 md:grid-cols-3">{([['Portal', 'in_app_enabled'], ['Email', 'email_reminders_enabled'], ['WhatsApp', 'whatsapp_reminders_enabled']] as const).map(([channel, field]) =>
          <label key={channel} className="flex items-center justify-between gap-3 rounded-md border p-3">{channel}
            <Switch checked={p[field] && !p.customer_opt_outs.includes(channel)} onCheckedChange={enabled => update(p.laboratory_id, {
              [field]: enabled, customer_opt_outs: enabled ? p.customer_opt_outs.filter(c => c !== channel) : [...new Set([...p.customer_opt_outs, channel])],
            })} /></label>)}</div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">Timezone<Input value={p.timezone} onChange={e => update(p.laboratory_id, { timezone: e.target.value })} required /></label>
          <label className="text-sm">Delivery time<Input type="time" value={p.delivery_time} onChange={e => update(p.laboratory_id, { delivery_time: e.target.value })} required /></label>
          <label className="text-sm">Sending ends (optional)<Input type="time" value={p.delivery_end_time ?? ""} onChange={e => update(p.laboratory_id, { delivery_end_time: e.target.value || null })} /></label>
          <label className="text-sm">Recipient emails (comma separated)<Input value={p.recipient_emails.join(", ")} onChange={e => update(p.laboratory_id, { recipient_emails: e.target.value.split(",").map(s => s.trim()) })} /></label>
          <label className="text-sm">WhatsApp numbers (international format, comma separated)<Input value={p.whatsapp_numbers.join(", ")} onChange={e => update(p.laboratory_id, { whatsapp_numbers: e.target.value.split(",").map(s => s.trim()) })} /></label>
        </div>
        {p.whatsapp_numbers.filter(Boolean).map(number => <label key={number} className="flex items-center gap-3 text-sm">
          <Switch checked={Boolean(p.whatsapp_consents[number])} onCheckedChange={enabled => update(p.laboratory_id, { whatsapp_consents: { ...p.whatsapp_consents, [number]: enabled } })} />
          I confirm consent to receive calibration reminders at {number}.
        </label>)}
        <p className="text-xs text-muted-foreground">Opt-outs apply across all portals. WhatsApp requires consent for each number.</p>
        <div className="grid gap-3 md:grid-cols-2">{Object.entries(p.reminder_timing).map(([milestone, enabled]) => <label key={milestone} className="flex items-center justify-between gap-3 text-sm">
          {milestone.replaceAll("_", " ")}<Switch checked={enabled} onCheckedChange={value => update(p.laboratory_id, { reminder_timing: { ...p.reminder_timing, [milestone]: value } })} />
        </label>)}</div>
        <h4 className="text-sm font-semibold">Portal lifecycle notifications</h4>
        <div className="grid gap-3 md:grid-cols-2">{lifecycleEventOptions.map(([event, label]) => <label key={event} className="flex items-center justify-between gap-3 text-sm">
          {label}<Switch checked={!(p.customer_event_opt_outs?.[event] ?? []).includes("Portal")} onCheckedChange={enabled => update(p.laboratory_id, {
            customer_event_opt_outs: { ...p.customer_event_opt_outs, [event]: enabled ? (p.customer_event_opt_outs?.[event] ?? []).filter(channel => channel !== "Portal") : [...new Set([...(p.customer_event_opt_outs?.[event] ?? []), "Portal" as const])] },
          })} />
        </label>)}</div>
        <Button type="submit" disabled={mutation.isPending}>Save preferences</Button>
      </form></CardContent>
    </Card>)}
  </section>;
}
