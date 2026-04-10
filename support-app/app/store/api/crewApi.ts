import { createApi } from "@reduxjs/toolkit/query/react";
import type { CrewMemberDetail, CrewMemberListItem } from "@/app/interfaces/CrewInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 300;

type CrewListEnvelope = { data?: { crew?: unknown[] } };
type CrewDetailEnvelope = { data?: { crew?: CrewMemberDetail } };

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

const crewApi = createApi({
  reducerPath: "crewApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["SupportCrew", "SupportCrewDetail"],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    
    getCrewList: builder.query<CrewMemberListItem[], string | void>({
      query: (q) => ({
        url: "/api/v1/crew/get_crew_list/",
        method: "GET",
        params: q ? { q } : undefined,
      }),
      transformResponse: (response: CrewListEnvelope) => {
        const rows = response.data?.crew ?? [];
        return rows.map((row) => {
          if (!isListItem(row)) throw new Error("Invalid crew row in API response");
          return row;
        });
      },
      providesTags: [{ type: "SupportCrew", id: "LIST" }],
    }),

    getCrewDetail: builder.query<CrewMemberDetail, string>({
      query: (crewId) => ({
        url: "/api/v1/crew/get_crew_detail/",
        method: "GET",
        params: { crew_id: crewId },
      }),
      transformResponse: (response: CrewDetailEnvelope) => {
        const c = response.data?.crew;
        if (!c) throw new Error("Missing crew in response");
        return c;
      },
      providesTags: (_result, _err, crewId) => [{ type: "SupportCrewDetail", id: crewId }],
    }),

    updateCrew: builder.mutation<
      CrewMemberDetail,
      { crew_id: string; is_active?: boolean; is_verified?: boolean }
    >({
      query: (body) => ({
        url: "/api/v1/crew/update_crew/",
        method: "PATCH",
        data: body,
      }),
      transformResponse: (response: CrewDetailEnvelope) => {
        const c = response.data?.crew;
        if (!c) throw new Error("Missing crew in response");
        return c;
      },
      invalidatesTags: (_result, _error, { crew_id }) => [
        { type: "SupportCrew", id: "LIST" },
        { type: "SupportCrewDetail", id: crew_id },
      ],
    }),
  }),
});

export const { useGetCrewListQuery, useGetCrewDetailQuery, useUpdateCrewMutation } = crewApi;
export default crewApi;
