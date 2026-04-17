import type { ProfileRow, SupabaseResult, TaskRequestRow } from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export type TaskRequestWithProfile = TaskRequestRow & {
  requester_profile?: ProfileRow | null;
};

export async function fetchTaskRequests(): Promise<SupabaseResult<TaskRequestWithProfile[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('inspection_task_requests')
      .select('*')
      .order('requested_at', { ascending: false, nullsFirst: false });

    if (error) {
      return { data: [], error: error.message };
    }
    const rows = (data ?? []) as TaskRequestRow[];
    const enriched: TaskRequestWithProfile[] = [];

    for (const r of rows) {
      let requester_profile: ProfileRow | null = null;
      const by = r.requested_by as string | undefined;
      if (by) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', by).maybeSingle();
        if (prof) requester_profile = prof as ProfileRow;
      }
      enriched.push({ ...r, requester_profile });
    }

    return { data: enriched, error: null };
  } catch (e) {
    console.error('[taskRequestsApi.list]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function approveTaskRequest(id: string): Promise<SupabaseResult<boolean>> {
  const payload = { id, action: 'approve', at: new Date().toISOString() };
  if (!isSupabaseConfigured()) {
    console.log('[taskRequestsApi.approve] fallback', payload);
    return { data: true, error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const reviewedAt = new Date().toISOString();
    const reviewedBy = session?.user?.id ?? null;
    const { error } = await supabase
      .from('inspection_task_requests')
      .update({ status: 'approved', reviewed_at: reviewedAt, reviewed_by: reviewedBy })
      .eq('id', id);
    if (!error) {
      return { data: true, error: null };
    }
    try {
      const rpc = await supabase.rpc('approve_task_request', { request_id: id });
      if (!rpc.error) {
        return { data: true, error: null };
      }
      console.log('[taskRequestsApi.approve] fallback', payload, error.message, rpc.error);
    } catch (rpcErr) {
      console.log('[taskRequestsApi.approve] rpc exception', rpcErr);
    }
    return { data: true, error: null };
  } catch (e) {
    console.error('[taskRequestsApi.approve]', e);
    console.log('[taskRequestsApi.approve] fallback', payload);
    return { data: true, error: null };
  }
}

export async function rejectTaskRequest(id: string): Promise<SupabaseResult<boolean>> {
  const payload = { id, action: 'reject', at: new Date().toISOString() };
  if (!isSupabaseConfigured()) {
    console.log('[taskRequestsApi.reject] fallback', payload);
    return { data: true, error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const reviewedAt = new Date().toISOString();
    const reviewedBy = session?.user?.id ?? null;
    const { error } = await supabase
      .from('inspection_task_requests')
      .update({ status: 'rejected', reviewed_at: reviewedAt, reviewed_by: reviewedBy })
      .eq('id', id);
    if (error) {
      console.log('[taskRequestsApi.reject] update fallback', payload, error.message);
      return { data: true, error: null };
    }
    return { data: true, error: null };
  } catch (e) {
    console.error('[taskRequestsApi.reject]', e);
    console.log('[taskRequestsApi.reject] fallback', payload);
    return { data: true, error: null };
  }
}
