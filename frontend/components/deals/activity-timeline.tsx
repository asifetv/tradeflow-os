/**
 * Activity timeline component
 */

"use client"

import { ActivityLog } from "@/lib/types/deal"
import { formatDistanceToNow } from "date-fns"

interface ActivityTimelineProps {
  activityLogs: ActivityLog[]
  isLoading?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  status_changed: "Status Changed",
  deleted: "Deleted",
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  updated: "bg-yellow-100 text-yellow-800",
  status_changed: "bg-purple-100 text-purple-800",
  deleted: "bg-red-100 text-red-800",
}

export function ActivityTimeline({ activityLogs, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (activityLogs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No activity logged yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activityLogs.map((log) => (
        <div key={log.id} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
            {log !== activityLogs[activityLogs.length - 1] && (
              <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
            )}
          </div>

          {/* Activity details */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"
                }`}
              >
                {ACTION_LABELS[log.action] || log.action}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Changes */}
            {log.changes.length > 0 && (
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {log.changes.map((change, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                    <span className="font-mono font-semibold">{change.field}</span>
                    {": "}
                    <span className="line-through text-red-600">{change.old_value || "(empty)"}</span>
                    {" → "}
                    <span className="text-green-600">{change.new_value || "(empty)"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
