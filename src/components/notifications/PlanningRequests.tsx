import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/services/notification.service";
import { useAuth } from "@/hooks/useAuth";
import { canEditCustomerModule } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function PlanningRequests() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [params] = useSearchParams();
  const selectedId = params.get("request");
  const query = useQuery({ queryKey: ["customer-calibration-requests", user?.user.organization_id, page],
    queryFn: () => notificationService.getRequests(page), refetchInterval: 60_000 });
  const detail = useQuery({ queryKey: ["customer-calibration-requests", user?.user.organization_id, "detail", selectedId],
    queryFn: () => notificationService.getRequest(selectedId!), enabled: Boolean(selectedId) });
  const records = selectedId ? (detail.data ? [detail.data] : []) : query.data?.requests ?? [];
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const canEdit = canEditCustomerModule(user?.user, "customer_notifications", user?.roles);
  const cancel = useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) =>
    notificationService.cancelRequest(id, version, reasons[id] ?? ""),
    onSuccess: () => { client.invalidateQueries({ queryKey: ["customer-calibration-requests"] });
      client.invalidateQueries({ queryKey: ["customer-notifications"] }); toast.success("Request cancelled"); },
    onError: () => toast.error("Unable to cancel. Refresh to check the latest request status.") });
  return <section className="space-y-3" id="calibration-requests">
    <h3 className="text-xl font-semibold">Your calibration requests</h3>
    {query.isLoading && <p>Loading requests...</p>}
    {query.isError && <p role="alert">Unable to load requests.</p>}
    {query.data?.requests.length === 0 && <p className="text-muted-foreground">No calibration requests yet.</p>}
    {records.map(request => <Card key={request.id} id={request.id}>
      <CardHeader><CardTitle className="flex items-center justify-between text-base">
        {request.items.length} gauges <Badge variant="outline">{request.status.replaceAll("_", " ")}</Badge>
      </CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {request.planned_date && <p>Planned date: {request.planned_date}</p>}
        {request.note && <p>Laboratory note: {request.note}</p>}
        <details><summary className="cursor-pointer font-medium">View gauges and history</summary>
          <ul className="mt-2 space-y-2">{request.items.map(({ snapshot: s }) => <li key={s.cycle_key}>
            {s.laboratory_name} · {s.gauge_name} · {s.identification_number ?? "—"} · {s.pending_acceptance ? "Calibration details await gauge verification" : `Due ${s.due_date}`}
          </li>)}</ul>
          <ul className="mt-3 text-muted-foreground">{request.history.map((event, index) => <li key={index}>
            {event.status.replaceAll("_", " ")} · {event.note || event.reason}
          </li>)}</ul>
        </details>
        {canEdit && ["submitted", "acknowledged", "scheduled"].includes(request.status) && <form className="flex gap-2" onSubmit={e => {
          e.preventDefault(); cancel.mutate({ id: request.id, version: request.version });
        }}>
          <Input required aria-label="Cancellation reason" placeholder="Cancellation reason" value={reasons[request.id] ?? ""}
            onChange={e => setReasons({ ...reasons, [request.id]: e.target.value })} />
          <Button type="submit" variant="outline" disabled={cancel.isPending}>Cancel request</Button>
        </form>}
      </CardContent>
    </Card>)}
    {!selectedId && <div className="flex items-center justify-end gap-3 text-sm">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
      <span>Page {page + 1} · {query.data?.total_count ?? 0} requests</span>
      <Button variant="outline" size="sm" disabled={(page + 1) * 25 >= (query.data?.total_count ?? 0)} onClick={() => setPage(page + 1)}>Next</Button>
    </div>}
  </section>;
}
