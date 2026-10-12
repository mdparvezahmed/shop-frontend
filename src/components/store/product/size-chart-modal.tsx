"use client";

import { Modal } from "@/components/ui/overlay";
import type { SizeChart } from "@/types";

export function SizeChartTable({ chart }: { chart: SizeChart }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-center text-sm">
          <thead className="bg-muted">
            <tr>
              {chart.columns.map((c) => (
                <th key={c} className="px-3 py-2.5 font-semibold whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {chart.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={j === 0 ? "px-3 py-2.5 font-medium" : "px-3 py-2.5 text-muted-foreground"}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        All measurements in {chart.unit}. {chart.note}
      </p>
    </div>
  );
}

export function SizeChartModal({ chart, open, onClose }: { chart: SizeChart; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Size chart" description={chart.name} size="lg">
      <SizeChartTable chart={chart} />
      <div className="mt-5 rounded-lg bg-muted p-4 text-sm">
        <p className="font-medium">How to measure</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li><strong>Chest:</strong> lay the garment flat and measure across from armpit to armpit, then double it.</li>
          <li><strong>Length:</strong> from the highest point of the shoulder down to the hem.</li>
          <li>Between sizes? Pick the larger size for a relaxed fit.</li>
        </ul>
      </div>
    </Modal>
  );
}
