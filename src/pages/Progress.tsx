import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ChartNoAxesCombined,
  CalendarDays,
  ClipboardCheck,
  Target,
} from "lucide-react";
import { Panel, PageTitle } from "../components/UI";
import type { Session, Interview } from "../types";
export default function Progress({
  sessions,
  interviews,
}: {
  sessions: Session[];
  interviews: Interview[];
}) {
  const average = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
    : 0;
  const data = [...sessions]
    .reverse()
    .map((s, i) => ({ session: `${i + 1}`, score: s.score }));
  return (
    <>
      <PageTitle
        title="Look how far you’ve come."
        subtitle="Small steps add up. Here’s your preparation so far."
      />
      <div className="stats-grid">
        {[
          {
            title: "Practice sessions",
            value: sessions.length,
            icon: ClipboardCheck,
          },
          {
            title: "Answers written",
            value: sessions.reduce((n, s) => n + s.answers.length, 0),
            icon: ChartNoAxesCombined,
          },
          { title: "Average demo score", value: `${average}%`, icon: Target },
          {
            title: "Upcoming interviews",
            value: interviews.filter((i) => i.status === "Upcoming").length,
            icon: CalendarDays,
          },
        ].map((s) => (
          <Panel key={s.title}>
            <s.icon size={22} />
            <strong className="stat-number">{s.value}</strong>
            <p>{s.title}</p>
          </Panel>
        ))}
      </div>
      <Panel>
        <div className="panel-heading">
          <h2>Practice over time</h2>
          <span className="badge">Demo structure score</span>
        </div>
        <p className="muted">
          Scores use local answer-structure rules and do not measure technical
          accuracy.
        </p>
        {data.length ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ left: 0, right: 20, top: 25, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8060ff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8060ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#25283a" vertical={false} />
                <XAxis
                  dataKey="session"
                  stroke="#9a9eb3"
                  tickLine={false}
                  label={{
                    value: "Session",
                    position: "insideBottom",
                    offset: -8,
                    fill: "#9a9eb3",
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#9a9eb3"
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "#151826",
                    border: "1px solid #34384e",
                    borderRadius: 12,
                    color: "#f5f7fb",
                  }}
                  labelFormatter={(v) => `Session ${v}`}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Demo score"
                  stroke="#9277ff"
                  strokeWidth={3}
                  fill="url(#chartFill)"
                  dot={{ fill: "#a99bff", r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state">
            <ChartNoAxesCombined size={32} />
            <h3>Your progress story starts here.</h3>
            <p>Complete a practice session to see your results.</p>
          </div>
        )}
      </Panel>
    </>
  );
}
