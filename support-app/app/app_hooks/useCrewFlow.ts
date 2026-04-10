/**
 * Crew (detailer) profile screen: fetch member, optional refetch, and PATCH toggles
 * for **active** and **verified** states with confirm dialogs and success/error alerts.
 *
 * @module app_hooks/useCrewFlow
 */
import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import type { CrewMemberDetail } from "@/app/interfaces/CrewInterface";
import { useAlertContext } from "@/app/contexts/AlertContext";
import { useGetCrewDetailQuery, useUpdateCrewMutation } from "@/app/store/api/crewApi";

/** Narrow unknown errors from RTK mutations to a user-visible string. */
function getErrMsg(e: unknown): string {
  if (!e || typeof e !== "object") return "Something went wrong";
  const data = (e as { data?: unknown }).data;
  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  if (typeof data === "string" && data.trim()) return data;
  return "Something went wrong";
}

/**
 * @param crewId - Detailer primary key (UUID string).
 */
export function useCrewFlow(crewId: string) {
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const {
    data: member,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetCrewDetailQuery(crewId, { skip: !crewId });

  const [updateCrew, { isLoading: updateLoading }] = useUpdateCrewMutation();

  const showError = useCallback(
    (title: string, message: string) => {
      setAlertConfig({
        isVisible: true,
        title,
        message,
        type: "error",
        confirmLabel: "OK",
        onConfirm: () => setIsVisible(false),
      });
    },
    [setAlertConfig, setIsVisible],
  );

  const openCall = useCallback((phone: string) => {
    const cleaned = phone.replace(/\s/g, "");
    Linking.openURL(`tel:${cleaned}`).catch(() => {});
  }, []);

  const openEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {});
  }, []);

  const requestToggleActive = useCallback(
    (m: CrewMemberDetail) => {
      const nextActive = !m.is_active;
      setAlertConfig({
        isVisible: true,
        title: nextActive ? "Reactivate member" : "Deactivate member",
        message: `${nextActive ? "Reactivate" : "Deactivate"} ${m.name}? They will ${
          nextActive ? "start" : "stop"
        } receiving new assignments.`,
        type: "warning",
        confirmLabel: "Confirm",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await updateCrew({
                crew_id: m.id,
                is_active: nextActive,
              }).unwrap();
              setAlertConfig({
                isVisible: true,
                title: "Updated",
                message: `Crew member is now ${nextActive ? "active" : "inactive"}.`,
                type: "success",
                confirmLabel: "OK",
                onConfirm: () => setIsVisible(false),
              });
            } catch (e: unknown) {
              showError("Error", getErrMsg(e));
            }
          })();
        },
      });
    },
    [setAlertConfig, setIsVisible, showError, updateCrew],
  );

  const requestToggleVerified = useCallback(
    (m: CrewMemberDetail) => {
      const nextVerified = !m.is_verified;
      setAlertConfig({
        isVisible: true,
        title: nextVerified ? "Mark verified" : "Mark unverified",
        message: nextVerified
          ? `Confirm ${m.name} has passed verification checks?`
          : `Remove verified status from ${m.name}?`,
        type: "warning",
        confirmLabel: "Confirm",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await updateCrew({
                crew_id: m.id,
                is_verified: nextVerified,
              }).unwrap();
              setAlertConfig({
                isVisible: true,
                title: "Updated",
                message: `Verification set to ${nextVerified ? "verified" : "unverified"}.`,
                type: "success",
                confirmLabel: "OK",
                onConfirm: () => setIsVisible(false),
              });
            } catch (e: unknown) {
              showError("Error", getErrMsg(e));
            }
          })();
        },
      });
    },
    [setAlertConfig, setIsVisible, showError, updateCrew],
  );

  const errorMessage = useMemo(() => {
    if (!isError) return undefined;
    return getErrMsg(error);
  }, [isError, error]);

  return {
    member,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    refetch,
    updateLoading,
    showError,
    openCall,
    openEmail,
    requestToggleActive,
    requestToggleVerified,
  };
}
