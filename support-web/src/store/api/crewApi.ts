/** Crew list/detail. PATCH is limited to `is_active` and `is_verified`. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  CrewMemberDetail,
  CrewMemberListItem,
  UpdateCrewRequest,
} from "../../types/crew";
import { getData, patchData } from "./client";

function isListItem(row: unknown): row is CrewMemberListItem {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.phone === "string" &&
    typeof o.is_active === "boolean" &&
    typeof o.is_verified === "boolean" &&
    typeof o.headline === "string"
  );
}

export async function getCrewList(q?: string): Promise<CrewMemberListItem[]> {
  const response = await getData<{ data?: { crew?: unknown[] } }>(SUPPORT_API.crewList, {
    params: q ? { q } : undefined,
  });
  const rows = response.data?.crew ?? [];
  return rows.map((row) => {
    if (!isListItem(row)) throw new Error("Invalid crew row in API response");
    return row;
  });
}

export async function getCrewDetail(crewId: string): Promise<CrewMemberDetail> {
  const response = await getData<{ data?: { crew?: CrewMemberDetail } }>(
    SUPPORT_API.crewDetail,
    { params: { crew_id: crewId } },
  );
  const crew = response.data?.crew;
  if (!crew) throw new Error("Missing crew in response");
  return crew;
}

export async function updateCrew(body: UpdateCrewRequest): Promise<CrewMemberDetail> {
  const response = await patchData<{ data?: { crew?: CrewMemberDetail } }>(
    SUPPORT_API.updateCrew,
    body,
  );
  const crew = response.data?.crew;
  if (!crew) throw new Error("Missing crew in response");
  return crew;
}
