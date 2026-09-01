"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchRiskSummary, RiskSummaryResponse } from "../lib/api";

export default function AdminDashboard() {
  const [data, setData] = useState<RiskSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskSummary()
      .then(setData)
      .catch((e) => {
        console.error(e);
        setError("데이터를 불러오지 못했어요. 서버 연결을 확인해주세요.");
      });
  }, []);

  if (error) return <div className="p-10 text-red-500">{error}</div>;
  if (!data) return <div className="p-10 text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-gray-50 px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">KB 밸런스 | 리스크 관제 대시보드</h1>
        <button className="text-sm text-gray-500 border rounded-lg px-3 py-1.5">
          고객 화면으로 전환
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard label="변동금리 대출자" value={`${data.total_variable_rate_borrowers.toLocaleString()}명`} />
        <SummaryCard
          label="리스크 위험군"
          value={`${data.high_risk_count.toLocaleString()}명 (${data.high_risk_pct}%)`}
        />
        <SummaryCard
          label="금리+1%p 시 상환부담 초과 예상"
          value={`${data.stress_exceed_count.toLocaleString()}명`}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100">
        <h2 className="text-sm text-gray-500 mb-4">리스크 등급 분포</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.risk_distribution}>
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="text-sm text-gray-500 mb-4">위험군 고객 리스트 (상위 10명)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b">
              <th className="py-2">고객ID</th>
              <th>리스크스코어</th>
              <th>대출잔액</th>
              <th>금리유형</th>
              <th>상환부담 증가 예상</th>
            </tr>
          </thead>
          <tbody>
            {data.at_risk_customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{c.id}</td>
                <td>{c.risk_score}/5</td>
                <td>{(c.loan_amount / 10000).toLocaleString()}만원</td>
                <td>{c.rate_type}</td>
                <td className="text-orange-500">+{(c.payment_increase / 10000).toLocaleString()}만원/월</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}