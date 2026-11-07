/**
 * The sidebar alert is deliberately fail-closed: authenticated mission state
 * must come from a current server snapshot for this account and WIB date.
 */
export function hasUnfinishedServerMissions({
  isAuthenticated = false,
  isLoading = true,
  hasServerSnapshot = false,
  quests = []
} = {}) {
  if (!isAuthenticated || isLoading || !hasServerSnapshot || !Array.isArray(quests) || quests.length === 0) {
    return false;
  }

  return quests.some((quest) => quest && quest.isCompleted !== true);
}
