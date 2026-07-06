import React from 'react'
import { ClientDateTime } from '@/shared/components'

interface ActivityLog {
  id: string
  created_at: string
  action: string
  resource_type: string
  resource_id?: string | null
  ip_address?: string | null
  profiles?: {
    name: string | null
    email: string | null
  } | null
}

interface ActivityLogsTableProps {
  logsList: ActivityLog[]
}

export function ActivityLogsTable({ logsList }: ActivityLogsTableProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 bg-white rounded-none overflow-hidden max-w-4xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
              <th className="py-3 px-5">Waktu Tulis</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Tindakan / Resource</th>
              <th className="py-3 px-4 text-center">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
            {logsList.map((log) => (
              <tr key={log.id} className="hover:bg-neutral-50/20 transition">
                <td className="py-3 px-5 text-neutral-500 whitespace-nowrap">
                  <ClientDateTime
                    date={log.created_at}
                    options={{
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }}
                  />
                </td>
                <td className="py-3 px-4">
                  <p>{log.profiles?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-neutral-400 font-normal">
                    {log.profiles?.email || 'admin@site.com'}
                  </p>
                </td>
                <td className="py-3 px-4 leading-relaxed">
                  <span className="font-semibold text-neutral-900 font-mono text-[10px] bg-neutral-100 px-1 py-0.5 select-all">
                    {log.action}
                  </span>
                  <p className="text-[10px] text-neutral-400 font-normal mt-0.5">
                    Tipe: {log.resource_type} | ID: {log.resource_id || '-'}
                  </p>
                </td>
                <td className="py-3 px-4 text-center text-neutral-500">{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
